// 1. กำหนดให้ไฟล์นี้เป็น Client Component (จำเป็นสำหรับ Hooks, event handlers)
"use client";

// 2. Import เครื่องมือพื้นฐานของ React/Next.js
import Image from "next/image";
import task from "../../assets/images/task.png"; // Import รูป logo
import Link from "next/link";
import Footer from "../../components/footer";
import { useState } from "react"; // Import React Hook 'useState'

// 3. Import Supabase client (สำหรับ "Storage" - เก็บไฟล์รูปภาพ)
import { supabase } from "@/lib/supabaseClient";

// 4. Import Firebase Firestore client (สำหรับ "Database" - เก็บข้อมูล)
import { firestoreDB } from "@/lib/firebaseConfig";
// 5. Import ฟังก์ชันที่จำเป็นของ Firestore (collection, addDoc)
import { collection, addDoc } from "firebase/firestore";

// 6. เริ่มต้นคอมโพเนนต์หลักของหน้า
export default function Page() {
  // 7. สร้างตัวแปร State สำหรับจัดการข้อมูลในฟอร์ม
  const [title, setTitle] = useState(""); // State สำหรับ "ชื่องาน"
  const [detail, setDetail] = useState(""); // State สำหรับ "รายละเอียด"
  const [imageFile, setImageFile] = useState<File | null>(null); // State สำหรับ "ไฟล์" รูปภาพ (ก้อนข้อมูล)
  const [imagePreview, setImagePreview] = useState(""); // State สำหรับ "URL พรีวิว" รูปภาพ
  const [isCompleted, setIsCompleted] = useState(false); // State สำหรับ "สถานะ" (ค่าเริ่มต้นคือ false)

  // 8. ฟังก์ชันสำหรับจัดการเมื่อผู้ใช้ "เลือกรูปภาพ"
  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    // 9. ดึงไฟล์แรกที่ผู้ใช้เลือก
    const file = event.target.files?.[0];
    // 10. ถ้ามีไฟล์
    if (file) {
      // 11. เก็บ "ไฟล์" (ก้อนข้อมูล) ไว้ใน state 'imageFile' (เพื่อเตรียมอัปโหลด)
      setImageFile(file);
      // 12. สร้าง URL ชั่วคราว (local URL) จากไฟล์นั้น
      //     แล้วเก็บไว้ใน state 'imagePreview' เพื่อแสดงรูปพรีวิวทันที
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 13. ฟังก์ชันหลัก: เมื่อผู้ใช้กด "บันทึกงานใหม่" (submit ฟอร์ม)
  const handleUploadAndSave = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    // 14. ป้องกันไม่ให้หน้าเว็บโหลดใหม่ (พฤติกรรมปกติของ form)
    event.preventDefault();

    // 15. ตรวจสอบ (Validate) ว่ากรอกข้อมูลครบหรือไม่
    if (title.trim() == "" || detail.trim() == "") {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return; // หยุดทำงานถ้าข้อมูลไม่ครบ
    }

    // 16. สร้างตัวแปรเก็บ image_url (ค่าเริ่มต้นคือ string ว่าง)
    let imageUrl = "";

    // 17. *** ตรวจสอบ: ถ้า 'imageFile' (state) มีค่า (แปลว่าผู้ใช้เลือกรูป) ***
    if (imageFile) {
      // 18. สร้างชื่อไฟล์ใหม่ที่ไม่ซ้ำกัน โดยใช้เวลา (Date.now())
      const newFileName = `${Date.now()}_${imageFile.name}`;

      // 19. *** อัปโหลด "ไฟล์" (imageFile) ไปยัง Supabase Storage ***
      //     ใน bucket ที่ชื่อ 'task_bk'
      const { data, error } = await supabase.storage
        .from("task_bk")
        .upload(newFileName, imageFile);

      // 20. ตรวจสอบ error จากการอัปโหลดไฟล์ (ถ้ามี)
      if (error) {
        alert("เกิดข้อผิดพลาดในการอัปโหลดรูป กรุณาลองใหม่อีกครั้ง");
        console.log(error.message);
        return;
      } else {
        // 21. (ถ้าอัปโหลด Storage สำเร็จ)
        // 22. ไปดึง Public URL ของไฟล์ที่เพิ่งอัปโหลด
        const { data } = supabase.storage
          .from("task_bk")
          .getPublicUrl(newFileName);

        // 23. นำ Public URL ที่ได้มา อัปเดตค่าในตัวแปร 'imageUrl'
        imageUrl = data.publicUrl;
      }
    }
    // (ถ้า `imageFile` เป็น null (คือผู้ใช้ไม่ใส่รูป) โค้ดใน if (ข้อ 17-23) จะถูกข้ามไป
    // และ 'imageUrl' จะยังคงเป็น "" (string ว่าง) ตามค่าเริ่มต้นในข้อ 16)

    // 24. *** บันทึกข้อมูลไปยัง Firebase Firestore ***
    //     สั่ง 'addDoc' (เพิ่มเอกสารใหม่) ลงใน 'collection' ที่ชื่อ "task_cl"
    await addDoc(collection(firestoreDB, "task_cl"), {
      title: title, // ค่าจาก state
      detail: detail, // ค่าจาก state
      image_url: imageUrl, // (จะเป็น "" ถ้าไม่อัปโหลด, หรือเป็น Public URL ถ้าอัปโหลด)
      is_completed: isCompleted, // ค่าจาก state
      created_at: new Date(), // บันทึกเวลาปัจจุบัน (Firestore จะแปลงเป็น Timestamp)
      update_at: null, // ยังไม่มีการแก้ไข
    });

    // 25. (ถ้าทุกอย่างสำเร็จ) แจ้งเตือน
    alert("บันทึกข้อมูลเรียบร้อยแล้ว");

    // 26. เปลี่ยนหน้า (redirect) กลับไปหน้า '/alltask'
    window.location.href = "/alltask";
  };

  // 27. ส่วนของ JSX (HTML) ที่จะแสดงผลบนหน้าจอ
  return (
    <>
      <div className="flex flex-col items-center pb-30">
        {/* 28. ส่วนหัว (Logo และ Title) */}
        <Image className="mt-20" src={task} alt="Task" width={120} />
        <h1 className="mt-8 text-2xl font-bold text-blue-700">
          Manage Task App
        </h1>
        <h1 className="mt-2 text-lg text-blue-700">บริการจัดการงานที่ทำ</h1>

        {/* 29. ส่วนฟอร์มเพิ่มงาน */}
        <div className="w-3xl border border-gray-500 p-10 mx-auto rounded-xl mt-5">
          <h1 className="text-xl font-bold text-center">➕ เพิ่มงานใหม่</h1>

          {/* 30. ตัวฟอร์ม: เมื่อกด submit ให้เรียกฟังก์ชัน handleUploadAndSave */}
          <form onSubmit={handleUploadAndSave} className="w-full space-y-4">
            {/* 31. Input: ชื่องาน (เชื่อมโยงกับ state 'title') */}
            <div>
              <label>ชื่องาน</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)} // เมื่อพิมพ์ ให้อัปเดต state
                type="text"
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            {/* 32. Textarea: รายละเอียด (เชื่อมโยงกับ state 'detail') */}
            <div>
              <label>รายละเอียด</label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)} // เมื่อพิมพ์ ให้อัปเดต state
                className="w-full border rounded-lg p-2"
                rows={5}
                required
              />
            </div>

            {/* 33. Input: อัปโหลดรูป */}
            <div>
              <label className="block mb-1 font-medium">อัปโหลดรูป</label>
              {/* 34. Input file จริงๆ จะถูกซ่อนไว้ (className="hidden") */}
              <input
                id="fileInput"
                type="file"
                accept="image/*" // รับเฉพาะไฟล์รูปภาพ
                className="hidden"
                onChange={handleSelectImage} // เมื่อเลือกไฟล์ ให้เรียกฟังก์ชัน
              />
              {/* 35. นี่คือ "ปุ่มปลอม" (label) ที่ผู้ใช้เห็นและกด */}
              {/* ใช้ 'htmlFor="fileInput"' เพื่อเชื่อมโยงกับ input file ที่ซ่อนอยู่ */}
              <label
                htmlFor="fileInput"
                className="inline-block bg-blue-500 text-white px-4 py-2
                          rounded cursor-pointer hover:bg-blue-600"
              >
                เลือกรูป
              </label>

              {/* 36. ส่วนแสดงตัวอย่างรูปภาพ */}
              {/* จะแสดงผลก็ต่อเมื่อ 'imagePreview' มีค่า (ไม่เป็น string ว่าง) */}
              {imagePreview && (
                <Image
                  src={imagePreview} // ใช้ URL ชั่วคราว (local) จาก state 'imagePreview'
                  alt="preview"
                  width={150}
                  height={150}
                  className="mt-2"
                />
              )}
            </div>

            {/* 37. Input: สถานะ (Select/Dropdown) */}
            <div>
              <label>สถานะ</label>
              <select
                // ถ้า isCompleted เป็น true ให้ value="1", ถ้า false ให้ value="0"
                value={isCompleted ? "1" : "0"}
                // เมื่อเปลี่ยนค่า: ถ้าค่าที่เลือกคือ "1" ให้ setIsCompleted(true)
                onChange={(e) => setIsCompleted(e.target.value === "1")}
                className="w-full border rounded-lg p-2"
              >
                <option value="0">❌ยังไม่เสร็จ</option>
                <option value="1">✅เสร็จแล้ว</option>
              </select>
            </div>

            {/* 38. ปุ่ม Submit ของฟอร์ม */}
            <div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white px-4 py-2
                                    rounded hover:bg-blue-600"
              >
                บันทึกงานใหม่
              </button>
            </div>
          </form>

          {/* 39. ลิงก์สำหรับกลับหน้าหลัก */}
          <Link
            href="/alltask"
            className="text-blue-500 w-full text-center mt-5 block hover:text-blue-600"
          >
            กลับไปหน้าแสดงงานทั้งหมด
          </Link>
        </div>

        {/* 40. ส่วน Footer */}
        <Footer />
      </div>
    </>
  );
}
