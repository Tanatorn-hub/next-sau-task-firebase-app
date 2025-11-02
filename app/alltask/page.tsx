"use client";

import Footer from "@/components/footer";
import Image from "next/image";
import task from "../../assets/images/task.png";
import Link from "next/link";
import { useEffect, useState } from "react";
import { firestoreDB } from "@/lib/firebaseConfig";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";

// สร้างประเภทข้อมูลแบบ Task
type Task = {
  id: string;
  created_at: string;
  title: string;
  detail: string;
  image_url: string | null;
  is_completed: boolean;
  update_at: string | null;
};

export default function Page() {
  // สร้างตัวแปรทั้งหมด
  const [tasks, setTasks] = useState<Task[]>([]);

  // สร้าง function เพื่อดึงข้อมูลจาก firebase
  useEffect(() => {
    // ดึงข้อมูลจาก firebase
    const fetchTasks = async () => {
      //ดึงข้อมูลมาแสดง
      const data = await getDocs(collection(firestoreDB, "task_cl"));

      //เอาข้อมูลที่ดึงมาไปกำหนดให้กับ state tasks
      setTasks(
        data.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          detail: doc.data().detail,
          image_url: doc.data().image_url || null,
          is_completed: doc.data().is_completed,
          created_at: doc.data().created_at.toDate().toISOString(),
          update_at: doc.data().update_at
            ? doc.data().update_at.toDate().toISOString()
            : null,
        }))
      );
    };

    fetchTasks();
  }, []);

  // สร้าง function เพื่อลบงานตาม id ออกจาก firebase
  const handleDeleteClick = async (id: string) => {
    //ก่อนลบให้ confirm ก่อน
    if (confirm("คุณแน่ใจหรือว่าต้องการลบงานนี้?")) {
      //ลบข้อมูลจาก firebase
      await deleteDoc(doc(firestoreDB, "task_cl", id));

      //อัพเดท state tasks โดยการกรองเอางานที่ถูกลบออก
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  return (
    <>
      <div className="flex flex-col items-center">
        {/* ส่วนบน */}
        <Image className="mt-20" src={task} alt="task" width={150} />
        <h1 className="mt-5 text-2xl font-bold text-blue-600">
          Manage Task App
        </h1>
        <h1 className="mt-2 text-lg text-blue-500">บริการจัดการงานที่ทำ</h1>

        {/* ปุ่มเพิ่มงาน */}
        <div className="flex justify-end w-10/12">
          <Link
            href="/addtask"
            className="mt-5 text-white bg-green-600 px-8 py-4 rounded hover:bg-green-700 cursor-pointer"
          >
            เพิ่มงาน
          </Link>
        </div>

        {/* ตารางรายการงาน */}
        <div className="w-10/12 flex mt-5">
          <table className="w-full border font-bold">
            <thead className="bg-blue-300">
              <tr className="text-center border">
                <td className="border p-2">รูป</td>
                <td className="border p-2">งานที่ต้องทำ</td>
                <td className="border p-2">รายละเอียดงาน</td>
                <td className="border p-2">สถานะ</td>
                <td className="border p-2">วันที่เพิ่ม</td>
                <td className="border p-2">วันที่แก้ไข</td>
                <td className="border p-2">ACTION</td>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="text-center border">
                  <td className="border p-2 flex justify-center items-center">
                    {task.image_url ? (
                      <Image
                        src={task.image_url}
                        alt={task.title || "task"}
                        width={50}
                        height={50}
                        className="object-cover rounded"
                      />
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="border p-2">{task.title}</td>
                  <td className="border p-2">{task.detail}</td>
                  <td className="border p-2">
                    {task.is_completed ? "✅สำเร็จ" : "❌ไม่สำเร็จ"}
                  </td>
                  <td className="border p-2">
                    {new Date(task.created_at).toLocaleString()}
                  </td>
                  <td className="border p-2">
                    {task.update_at
                      ? new Date(task.update_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="border p-2">
                    <Link
                      className="text-green-500 mr-5 hover:text-green-700"
                      href={`/updatetask/${task.id}`}
                    >
                      แก้ไข
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(task.id)}
                      className="text-red-500 cursor-pointer hover:text-red-700"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Footer />
      </div>
    </>
  );
}
