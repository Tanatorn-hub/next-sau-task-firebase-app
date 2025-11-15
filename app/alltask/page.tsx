// 1. กำหนดให้ไฟล์นี้เป็น Client Component
// จำเป็นต้องใช้ เพราะเรามีการใช้ React Hooks (useState, useEffect) และ event handlers (onClick)
"use client";

// 2. Import เครื่องมือที่จำเป็น
import Footer from "@/components/footer"; // Import คอมโพเนนต์ Footer
import Image from "next/image"; // Import คอมโพเนนต์ Image ของ Next.js
import task from "../../assets/images/task.png"; // Import รูป logo
import Link from "next/link"; // Import คอมโพเนนต์ Link สำหรับการนำทาง
import { useEffect, useState } from "react"; // Import React Hooks

// 3. Import Firebase Firestore client และฟังก์ชันที่จำเป็น
import { firestoreDB } from "@/lib/firebaseConfig"; // Import 'db' ที่เราตั้งค่าไว้
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"; // Import ฟังก์ชัน Firestore:
// - collection: ใช้อ้างอิง "กลุ่มข้อมูล" (เช่น โฟลเดอร์)
// - getDocs: ใช้ "ดึงเอกสารทั้งหมด" จาก collection
// - doc: ใช้อ้างอิง "เอกสารเดียว" (เช่น ไฟล์)
// - deleteDoc: ใช้ "ลบเอกสาร"

// 4. สร้างประเภทข้อมูล (TypeScript Type) ของ Task
//    เพื่อกำหนดโครงสร้างข้อมูลให้ชัดเจน
type Task = {
  id: string; // ID ของเอกสาร (Firestore จะสร้างให้)
  created_at: string; // วันที่สร้าง (เราจะแปลงเป็น string)
  title: string;
  detail: string;
  image_url: string | null; // URL รูป (อาจจะไม่มี)
  is_completed: boolean;
  update_at: string | null; // วันที่แก้ไข (อาจจะไม่มี)
};

// 5. เริ่มต้นคอมโพเนนต์หลักของหน้า
export default function Page() {
  // 6. สร้าง State สำหรับเก็บ "รายการ Task ทั้งหมด" ที่จะแสดงในตาราง
  //    เริ่มต้นเป็น array ว่าง `[]`
  const [tasks, setTasks] = useState<Task[]>([]);

  // 7. ใช้ useEffect เพื่อดึงข้อมูลจาก Firebase
  //    (จะทำงานแค่ครั้งเดียวตอนโหลดหน้านี้ เพราะ `[]` (dependency array) ว่างเปล่า)
  useEffect(() => {
    // 8. สร้าง async function ภายใน useEffect เพื่อดึงข้อมูล
    const fetchTasks = async () => {
      // 9. *** ดึงข้อมูลจาก Firestore ***
      //    สั่ง 'getDocs' (ดึงเอกสารทั้งหมด) จาก 'collection' ที่ชื่อ "task_cl"
      const data = await getDocs(collection(firestoreDB, "task_cl"));

      // 10. *** แปลงข้อมูล (Map) ***
      //     ข้อมูลที่ได้ (data.docs) ต้องถูกแปลง (map) ก่อนนำไปใช้
      //     เพราะข้อมูล (data()) กับ ID (doc.id) อยู่แยกกัน
      setTasks(
        data.docs.map((doc) => ({
          // 10.1. `id: doc.id`: ดึง ID ของเอกสาร
          id: doc.id,
          // 10.2. `...: doc.data()....`: ดึงข้อมูลจาก field ต่างๆ ภายในเอกสาร
          title: doc.data().title,
          detail: doc.data().detail,
          image_url: doc.data().image_url || null, // (ใส่ || null กัน error ถ้าไม่มี field นี้)
          is_completed: doc.data().is_completed,

          // 10.3. *** จัดการข้อมูลเวลา (Timestamp) ***
          //       Firestore จะเก็บเวลาเป็น object 'Timestamp'
          //       เราต้องแปลงเป็น string (ด้วย .toDate().toISOString())
          //       เพื่อให้ React จัดการใน state ได้ง่าย
          created_at: doc.data().created_at.toDate().toISOString(),

          // 10.4. (จัดการ field ที่อาจจะไม่มีค่า)
          //       เช็คก่อนว่ามี `update_at` ไหม ถ้ามี ค่อยแปลง
          update_at: doc.data().update_at
            ? doc.data().update_at.toDate().toISOString()
            : null,
        }))
      );
      // 11. (จบ) เมื่อ setTasks ทำงาน, state 'tasks' จะมีข้อมูล และหน้าเว็บจะ re-render เพื่อแสดงตาราง
    };

    // 12. เรียกใช้ฟังก์ชัน fetchTasks() ที่เราเพิ่งสร้าง
    fetchTasks();
  }, []); // `[]` ที่ว่างเปล่า หมายความว่า effect นี้จะทำงานแค่ครั้งเดียวตอนโหลดหน้า

  // 13. สร้างฟังก์ชันสำหรับ "ลบ" Task (เมื่อผู้ใช้กดปุ่ม "ลบ")
  //     ฟังก์ชันนี้จะรับ 'id' (string) ของ task ที่ต้องการลบเข้ามา
  const handleDeleteClick = async (id: string) => {
    // 14. แสดงหน้าต่าง 'confirm' เพื่อยืนยันการลบ
    if (confirm("คุณแน่ใจหรือว่าต้องการลบงานนี้?")) {
      // 15. (ถ้าผู้ใช้กดยืนยัน) *** ลบข้อมูลออกจาก Firebase ***
      //     สั่ง 'deleteDoc' โดยอ้างอิง 'doc' (เอกสาร)
      //     ใน collection "task_cl" ที่มี 'id' ตรงกัน
      await deleteDoc(doc(firestoreDB, "task_cl", id));

      // 16. *** อัปเดต State ในหน้าเว็บทันที (Client-side update) ***
      //     เราจะ "กรอง" (filter) state 'tasks' เดิม
      //     โดยเก็บไว้เฉพาะ task ที่ `task.id` "ไม่เท่ากับ" `id` ที่เพิ่งลบไป
      //     ผลคือ UI จะอัปเดตทันที โดยไม่ต้องโหลดข้อมูลใหม่ทั้งหน้า
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  // 17. ส่วนของ JSX (HTML) ที่จะแสดงผลบนหน้าจอ
  return (
    <>
      <div className="flex flex-col items-center">
        {/* 17.1. ส่วนหัว (Logo และ Title) */}
        <Image className="mt-20" src={task} alt="task" width={150} />
        <h1 className="mt-5 text-2xl font-bold text-blue-600">
          Manage Task App
        </h1>
        <h1 className="mt-2 text-lg text-blue-500">บริการจัดการงานที่ทำ</h1>

        {/* 17.2. ปุ่มสำหรับลิงก์ไปหน้า "เพิ่มงาน" (/addtask) */}
        <div className="flex justify-end w-10/12">
          <Link
            href="/addtask"
            className="mt-5 text-white bg-green-600 px-8 py-4 rounded hover:bg-green-700 cursor-pointer"
          >
            เพิ่มงาน
          </Link>
        </div>

        {/* 17.3. ส่วนตารางที่ใช้แสดงรายการ Task ทั้งหมด */}
        <div className="w-10/12 flex mt-5">
          <table className="w-full border font-bold">
            {/* 17.4. ส่วนหัวตาราง (Table Head) */}
            <thead className="bg-blue-300">
              <tr className="text-center border">
                <td className="border p-2">รูป</td>
                <td className="border p-2">งานที่ต้องทำ</td>
                {/* ... (หัวตารางอื่นๆ) ... */}
                <td className="border p-2">ACTION</td>
              </tr>
            </thead>

            {/* 17.5. ส่วนเนื้อหาตาราง (Table Body) */}
            <tbody>
              {/* 17.6. ใช้ .map() เพื่อ "วนลูป" ข้อมูลใน state 'tasks'
                     เพื่อนำแต่ละ 'task' มาสร้างแถว (<tr>) ทีละแถว */}
              {tasks.map((task) => (
                // 17.7. `key={task.id}`: สำคัญมากสำหรับ React
                //       เพื่อให้รู้ว่าแถวไหนเป็นแถวไหน
                <tr key={task.id} className="text-center border">
                  {/* 17.8. แสดงรูป (เช็คก่อนว่า task.image_url มีค่าหรือไม่) */}
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
                  {/* ... (แสดงข้อมูล field อื่นๆ) ... */}
                  <td className="border p-2">{task.title}</td>
                  <td className="border p-2">{task.detail}</td>
                  <td className="border p-2">
                    {task.is_completed ? "✅สำเร็จ" : "❌ไม่สำเร็จ"}
                  </td>
                  {/* 17.9. แสดงวันที่ (แปลง string กลับเป็น Date เพื่อจัดรูปแบบ) */}
                  <td className="border p-2">
                    {new Date(task.created_at).toLocaleString()}
                  </td>
                  <td className="border p-2">
                    {task.update_at
                      ? new Date(task.update_at).toLocaleString()
                      : "-"}
                  </td>
                  {/* 17.10. ส่วน Action (ปุ่มแก้ไขและลบ) */}
                  <td className="border p-2">
                    {/* 17.11. ลิงก์ "แก้ไข" ที่ส่ง `task.id` ไปกับ URL */}
                    <Link
                      className="text-green-500 mr-5 hover:text-green-700"
                      href={`/updatetask/${task.id}`}
                    >
                      แก้ไข
                    </Link>
                    {/* 17.12. ปุ่ม "ลบ" ที่เมื่อคลิก (onClick)
                           จะเรียก `handleDeleteClick` พร้อมส่ง `task.id` ของแถวนี้ไป */}
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

        {/* 17.13. แสดง Footer */}
        <Footer />
      </div>
    </>
  );
}
