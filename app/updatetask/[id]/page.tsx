// 1. กำหนดให้เป็น Client Component (จำเป็นสำหรับ Hooks, event handlers)
"use client";

// 2. Import เครื่องมือพื้นฐานของ React/Next.js
import Image from "next/image";
import task from "../../../assets/images/task.png"; // Import รูป logo
import Link from "next/link";
import Footer from "../../../components/footer";
import { useState, useEffect } from "react"; // Import React Hooks
import { useParams } from "next/navigation"; // Import hook สำหรับดึงค่า [id] จาก URL

// 3. Import Supabase client (สำหรับ "Storage" - เก็บไฟล์รูปภาพ)
import { supabase } from "@/lib/supabaseClient";

// 4. Import Firebase Firestore client (สำหรับ "Database" - เก็บข้อมูล)
import { firestoreDB } from "@/lib/firebaseConfig";

// 5. Import ฟังก์ชันที่จำเป็นของ Firestore
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";

// 6. เริ่มต้นคอมโพเนนต์หลักของหน้า
export default function Page() {
  // 7. ดึงค่า id จาก URL (เช่น /edit/abc12345)
  //    (หมายเหตุ: id ของ Firestore จะเป็น string)
  const id = useParams().id;

  // 8. สร้าง States สำหรับเก็บข้อมูลในฟอร์ม
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null); // State เก็บ "ไฟล์" รูปใหม่ (ถ้าเลือก)
  const [imagePreview, setImagePreview] = useState(""); // State เก็บ "URL" รูปที่จะแสดง (ทั้งเก่าและใหม่)
  const [isCompleted, setIsCompleted] = useState(false);

  // 9. useEffect: ทำงานครั้งเดียวตอนโหลดหน้า เพื่อดึงข้อมูลเดิมมาแสดง
  useEffect(() => {
    // 10. ฟังก์ชันสำหรับดึงข้อมูลจาก Firestore
    async function fetchData() {
      // 11. สั่ง 'getDoc': ดึงเอกสาร (doc) จาก collection "task_cl"
      //     โดยระบุ id ที่ได้มาจาก URL
      const data = await getDoc(doc(firestoreDB, "task_cl", id as string));

      // 12. ใช้ try...catch เพื่อจัดการ error (เช่น ถ้าไม่พบข้อมูล)
      try {
        // 13. นำข้อมูลที่ได้มา (data.data()) ไปตั้งค่าใน State
        //     `|| ""` หรือ `|| false` คือการกำหนดค่า default กัน error หาก field นั้นไม่มีข้อมูล
        setTitle(data.data()?.title || "");
        setDetail(data.data()?.detail || "");
        setImagePreview(data.data()?.image_url || ""); // URL รูปเก่า
        setIsCompleted(data.data()?.is_completed || false);
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง");
        console.log(error);
        throw error;
      }
    }

    // 14. เรียกใช้ฟังก์ชันดึงข้อมูล
    fetchData();
  }, []); // `[]` หมายถึงให้ทำงานแค่ครั้งเดียว

  // 15. ฟังก์ชันเมื่อผู้ใช้ "เลือกไฟล์รูป"
  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // 16. ดึงไฟล์ที่เลือก
    if (file) {
      // 17. ถ้ามีไฟล์
      setImageFile(file); // 18. เก็บ "ไฟล์" (ก้อนข้อมูล) ไว้ใน state
      setImagePreview(URL.createObjectURL(file)); // 19. สร้าง URL ชั่วคราว (local) เพื่อแสดงพรีวิวรูปใหม่
    }
  };

  // 20. ฟังก์ชันหลัก: เมื่อผู้ใช้กด "บันทึกแก้ไขงาน" (submit ฟอร์ม)
  const handleUploadAndUpdate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault(); // 21. ป้องกันหน้าโหลดใหม่

    // 22. ตรวจสอบ (Validate) ว่ากรอกข้อมูลครบหรือไม่
    if (title.trim() == "" || detail.trim() == "") {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // 23. สร้างตัวแปร imageUrl (ค่าเริ่มต้นคือ URL รูปเดิมที่แสดงอยู่)
    let imageUrl = imagePreview || "";

    // 24. *** ตรวจสอบ: ถ้า 'imageFile' (state) มีค่า (แปลว่าผู้ใช้เลือกรูปใหม่) ***
    if (imageFile) {
      // 25. สร้างชื่อไฟล์ใหม่ที่ไม่ซ้ำกัน
      const newFileName = `${Date.now()}_${imageFile.name}`;

      // 26. *** อัปโหลด "ไฟล์ใหม่" ไปยัง Supabase Storage (bucket: task_bk) ***
      const { data, error } = await supabase.storage
        .from("task_bk")
        .upload(newFileName, imageFile);

      // 27. (ถ้าอัปโหลด Storage error) แจ้งเตือนและหยุด
      if (error) {
        alert("เกิดข้อผิดพลาดในการอัปโหลดรูป กรุณาลองใหม่อีกครั้ง");
        console.log(error.message);
        return;
      } else {
        // 28. (ถ้าอัปโหลด Storage สำเร็จ)
        // 29. ดึง Public URL ของไฟล์ที่เพิ่งอัปโหลด
        const { data } = supabase.storage
          .from("task_bk")
          .getPublicUrl(newFileName);

        // 30. อัปเดตตัวแปร 'imageUrl' ให้เป็น URL ใหม่นี้
        imageUrl = data.publicUrl;
      }
    }
    // (ถ้าผู้ใช้ไม่เลือกรูปใหม่ โค้ดใน if (ข้อ 24-30) จะถูกข้าม
    // และ 'imageUrl' จะยังเป็นค่าเดิม (จากข้อ 23))

    // 31. เริ่มต้น try...catch สำหรับการอัปเดต Firestore
    try {
      // 32. *** อัปเดตข้อมูลไปยัง Firebase Firestore ***
      //     สั่ง 'updateDoc' ที่เอกสาร (doc) ใน "task_cl" ที่มี id ตรงกัน
      await updateDoc(doc(firestoreDB, "task_cl", id as string), {
        // 33. ส่งข้อมูลใหม่ทั้งหมด
        title: title,
        detail: detail,
        image_url: imageUrl, // (ไม่ว่าจะเป็น URL เก่า หรือ URL ใหม่ที่เพิ่งอัปโหลด)
        is_completed: isCompleted,
        update_at: new Date(), // บันทึกเวลาที่แก้ไข
      });

      // 34. (ถ้าสำเร็จ) แจ้งเตือน
      alert("แก้ไขงานเรียบร้อยแล้ว");
      // 35. Redirect กลับหน้า alltask
      window.location.href = "/alltask";
    } catch (error) {
      // 36. (ถ้าอัปเดต Firestore error) แจ้งเตือนและหยุด
      alert("เกิดข้อผิดพลาดในการอัปเดตงาน กรุณาลองใหม่อีกครั้ง");
      console.log(error);
      return;
    }
  };

  // 37. ส่วน JSX (HTML) ที่จะแสดงผล
  return (
    <>
      <div className="flex flex-col items-center pb-30">
        {/* 38. ส่วนหัว (Logo, Title) */}
        <Image className="mt-20" src={task} alt="Task" width={120} />
        <h1 className="mt-8 text-2xl font-bold text-blue-700">
          Manage Task App
        </h1>
        <h1 className="mt-2 text-lg text-blue-700">บริการจัดการงานที่ทำ</h1>

        {/* 39. กล่องฟอร์ม */}
        <div className="w-3xl border border-gray-500 p-10 mx-auto rounded-xl mt-5">
          <h1 className="text-xl font-bold text-center"> 🔧 แก้ไขงานเก่า</h1>

          {/* 40. ตัวฟอร์ม: เมื่อ submit ให้เรียก 'handleUploadAndUpdate' */}
          <form onSubmit={handleUploadAndUpdate} className="w-full space-y-4">
            {/* 41. Input: ชื่องาน (เชื่อมโยงกับ state 'title') */}
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

            {/* 42. Textarea: รายละเอียด (เชื่อมโยงกับ state 'detail') */}
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

            {/* 43. Input "เลือกรูป" */}
            <div>
              <label className="block mb-1 font-medium">อัปโหลดรูป</label>
              {/* ตัว Input file จริง (ซ่อนไว้) */}
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelectImage} // เมื่อเลือก ให้เรียกฟังก์ชัน
              />
              {/* ปุ่มปลอม (Label) ที่ผู้ใช้กด */}
              <label
                htmlFor="fileInput"
                className="inline-block bg-blue-500 text-white px-4 py-2
                          rounded cursor-pointer hover:bg-blue-600"
              >
                เลือกรูป
              </label>

              {/* 44. ส่วนแสดงพรีวิวรูป (ถ้า 'imagePreview' มีค่า) */}
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

            {/* 45. Select: สถานะ (เชื่อมโยงกับ state 'isCompleted') */}
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

            {/* 46. ปุ่ม "บันทึกแก้ไขงาน" (ปุ่ม submit) */}
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

          {/* 47. ลิงก์กลับหน้าหลัก */}
          <Link
            href="/alltask"
            className="text-blue-500 w-full text-center mt-5 block hover:text-blue-600"
          >
            กลับไปหน้าแสดงงานทั้งหมด
          </Link>
        </div>

        {/* 48. แสดง Footer */}
        <Footer />
      </div>
    </>
  );
}
