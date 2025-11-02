"use client";

import Image from "next/image";
import task from "../../../assets/images/task.png";
import Link from "next/link";
import Footer from "../../../components/footer";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { firestoreDB } from "@/lib/firebaseConfig";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";

export default function Page() {
  // สร้างตัวแปรเก็บ id ที่ส่งมา
  const id = useParams().id;

  //สร้างตัวแปร state สำหรับทำงานกับข้อมูลที่ผู้ใช้ป้อน และเลือก
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // ดึงข้อมูลงานเก่าจากฐานข้อมูลมาแสดงในฟอร์มเพื่อแก้ไข
    async function fetchData() {
      const data = await getDoc(doc(firestoreDB, "task_cl", id as string));
      try {
        setTitle(data.data()?.title || "");
        setDetail(data.data()?.detail || "");
        setImagePreview(data.data()?.image_url || "");
        setIsCompleted(data.data()?.is_completed || false);
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง");
        console.log(error);
        throw error;
      }
    }

    fetchData();
  }, []);

  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAndUpdate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    // Validate input fields
    if (title.trim() == "" || detail.trim() == "") {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    //สร้างตัวแปรเก็บ image_url
    let imageUrl = imagePreview || "";
    // อัปโหลดรูป
    // ตรวจสอบก่อนว่าได้เลือกรูปหรือไม่
    if (imageFile) {
      //สร้างชื่อไฟล์ใหม่ไม่ซ้ำกัน
      const newFileName = `${Date.now()}_${imageFile.name}`;

      //อัปโหลดไฟล์ไปเก็บใน Supabase Storage
      const { data, error } = await supabase.storage
        .from("task_bk")
        .upload(newFileName, imageFile);

      //ตรวจสอบ error
      if (error) {
        alert("เกิดข้อผิดพลาดในการอัปโหลดรูป กรุณาลองใหม่อีกครั้ง");
        console.log(error.message);
        return;
      } else {
        //ไปเอา image url ของรูปที่อัปโหลดมาเพื่อไปบันทึกลงตาราง
        const { data } = supabase.storage
          .from("task_bk")
          .getPublicUrl(newFileName);

        imageUrl = data.publicUrl;
      }
    }
    try {
      // บันทึกข้อมูลงานใหม่ลง task_cl ใน firestore
      await updateDoc(doc(firestoreDB, "task_cl", id as string), {
        title: title,
        detail: detail,
        image_url: imageUrl,
        is_completed: isCompleted,
        update_at: new Date(),
      });
      //แจ้งเตือนว่าบันทึกสำเร็จ
      alert("แก้ไขงานเรียบร้อยแล้ว");
      //redirect ไปหน้า alltask
      window.location.href = "/alltask";
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปเดตงาน กรุณาลองใหม่อีกครั้ง");
      console.log(error);
      return;
    }
  };

  return (
    <>
      <div className="flex flex-col items-center pb-30">
        {/* ส่วนบน */}
        <Image className="mt-20" src={task} alt="Task" width={120} />

        <h1 className="mt-8 text-2xl font-bold text-blue-700">
          Manage Task App
        </h1>

        <h1 className="mt-2 text-lg text-blue-700">บริการจัดการงานที่ทำ</h1>

        {/* ส่วนเพิ่มงาน */}
        <div className="w-3xl border border-gray-500 p-10 mx-auto rounded-xl mt-5">
          <h1 className="text-xl font-bold text-center"> 🔧 แก้ไขงานเก่า</h1>

          <form onSubmit={handleUploadAndUpdate} className="w-full space-y-4">
            <div>
              <label>ชื่องาน</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                className="w-full border rounded-lg p-2"
                required
              />
            </div>
            <div>
              <label>รายละเอียด</label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="w-full border rounded-lg p-2"
                rows={5}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">อัปโหลดรูป</label>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelectImage}
              />
              <label
                htmlFor="fileInput"
                className="inline-block bg-blue-500 text-white px-4 py-2
                    rounded cursor-pointer hover:bg-blue-600"
              >
                เลือกรูป
              </label>
              {/* แสดงรูปที่เลือก */}
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="preview"
                  width={150}
                  height={150}
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <label>สถานะ</label>
              <select
                value={isCompleted ? "1" : "0"}
                onChange={(e) => setIsCompleted(e.target.value === "1")}
                className="w-full border rounded-lg p-2"
              >
                <option value="0">❌ยังไม่เสร็จ</option>
                <option value="1">✅เสร็จแล้ว</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white px-4 py-2
                                    rounded hover:bg-blue-600"
              >
                บันทึกแก้ไขงาน
              </button>
            </div>
          </form>

          <Link
            href="/alltask"
            className="text-blue-500 w-full text-center mt-5 block hover:text-blue-600"
          >
            กลับไปหน้าแสดงงานทั้งหมด
          </Link>
        </div>

        {/* ส่วน Footer*/}
        <Footer />
      </div>
    </>
  );
}
