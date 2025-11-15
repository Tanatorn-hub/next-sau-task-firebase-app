// 1. นำเข้า (import) ฟังก์ชัน 'initializeApp'
//    นี่คือฟังก์ชันหลักสำหรับ "เริ่มต้นการเชื่อมต่อ" (initialize) Firebase
import { initializeApp } from "firebase/app";

// 2. นำเข้าฟังก์ชัน 'getFirestore'
//    นี่คือฟังก์ชันสำหรับ "ดึงบริการ Database (Firestore)"
//    หลังจากที่เรา initialize app แล้ว
import { getFirestore } from "firebase/firestore";

// 3. นำเข้า 'getApps' และ 'getApp'
//    - getApps: ใช้สำหรับ "ตรวจสอบ" ว่ามีแอป Firebase ที่เชื่อมต่อแล้วหรือยัง
//    - getApp: ใช้สำหรับ "ดึง" แอปเดิมที่เคยเชื่อมต่อไว้แล้ว
//    (จำเป็นมากสำหรับ Next.js เพื่อป้องกันการเชื่อมต่อซ้ำซ้อนตอน Fast Refresh)
import { getApps, getApp } from "firebase/app";

// 4. สร้าง object 'firebaseConfig' เพื่อเก็บค่าตั้งค่าทั้งหมด
//    ค่าเหล่านี้ถูกดึงมาจาก "Environment Variables" (ไฟล์ .env.local)
//    `process.env.NEXT_PUBLIC_...` คือวิธีที่ Next.js ใช้
//    ในการดึงค่าที่ปลอดภัยสำหรับให้โค้ดฝั่งเบราว์เซอร์ (Client) ใช้งานได้
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 5. *** ส่วนสำคัญ: ตรวจสอบและเริ่มต้นการเชื่อมต่อ (Singleton Pattern) ***
//
//    `getApps()`: ขอดูว่ามีแอปที่เชื่อมต่อแล้วกี่ตัว (ได้ผลเป็น array)
//    `!getApps().length`: ตรวจสอบว่า "ถ้า array นั้นว่างเปล่า" (length = 0)
//                        หรือ "ถ้ายังไม่มีแอปที่เชื่อมต่อเลย"
//
//    (ถ้าเป็นจริง ?) ให้ `initializeApp(firebaseConfig)`:
//                   "สร้างการเชื่อมต่อใหม่"
//
//    (ถ้าเป็นเท็จ :) ให้ `getApp()`:
//                   "ดึงเอาการเชื่อมต่อเดิมที่เคยสร้างไว้แล้วมาใช้"
//
//    เหตุผล: เพื่อป้องกันปัญหาใน Next.js (โหมด development) ที่จะรันโค้ดนี้ซ้ำๆ
//    และสร้างการเชื่อมต่อ Firebase ใหม่ทุกครั้งที่เซฟไฟล์
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 6. สั่ง 'getFirestore' (ดึงบริการ Database) โดยใช้ 'app' ที่เราได้มา (ไม่ว่าจะเป็นแอปใหม่หรือแอปเดิม)
// 7. 'export' ตัวแปร 'firestoreDB' นี้ออกไป
//    เพื่อให้ไฟล์อื่นๆ (เช่น page.tsx) สามารถ import ไปใช้งานต่อได้
export const firestoreDB = getFirestore(app);