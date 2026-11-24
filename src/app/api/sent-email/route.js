// import { resend } from "@/lib/resend";

// export async function POST() {
//   const { data, error } = await resend.emails.send({
//     from: "Fallora <onboarding@resend.dev>",
//     to: ["delivered@resend.dev"],
//     subject: "Testing Email Fallora",
//     html: `
//       <h1>Hello from Fallora!</h1>
//       <p>Resend berhasil terhubung.</p>
//     `,
//   });

//   if (error) {
//     return Response.json(
//       { success: false, error },
//       { status: 400 }
//     );
//   }

//   return Response.json({
//     success: true,
//     data,
//   });
// }