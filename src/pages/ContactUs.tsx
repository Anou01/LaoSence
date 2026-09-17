import { useState } from "react";

export default function ContactPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16">
      {/* Header */}
      <header className="text-center max-w-3xl px-6">
        <h1 className="text-4xl font-extrabold text-gray-900">
          Let's Stay Connected
        </h1>
        <p className="mt-3 text-gray-600 text-lg">
          Stay in touch with us! We'd love to hear from you and assist you with
          any inquiries.
        </p>
      </header>

      {/* Main Layout */}
      <main className="mt-12 flex flex-col lg:flex-row items-start gap-12 w-full max-w-6xl px-6">
        {/* Google Map */}
        <div className="w-full lg:w-1/2 drop-shadow-md">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3492.569935722442!2d102.62618910254308!3d17.939147743791402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDU2JzIwLjkiTiAxMDLCsDM3JzM0LjMiRQ!5e0!3m2!1sen!2sla!4v1732185040000!5m2!1sen!2sla"
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: "20px" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps Location"
          />
        </div>

        {/* Contact Info + Button */}
        <aside className="w-full lg:w-1/2 flex flex-col gap-4">
          {/* Card 1 */}
          <div className="bg-primary text-white p-6 rounded-2xl shadow-xl flex items-center justify-between hover:scale-[1.02] transition">
            <div>
              <h3 className="font-semibold text-lg">Location</h3>
              <p className="text-sm opacity-90">
                The Computer Engineering and IT Department
              </p>
            </div>
            <div className="text-2xl opacity-80">📍</div>
          </div>

          {/* Card 2 */}
          <div className="bg-primary text-white p-6 rounded-2xl shadow-xl flex items-center justify-between hover:scale-[1.02] transition">
            <div>
              <h3 className="font-semibold text-lg">Email</h3>
              <p className="text-sm opacity-90">
                cybersecurityceit2023@gmail.com
              </p>
            </div>
            <div className="text-2xl opacity-80">✉️</div>
          </div>

          {/* Card 3 */}
          <div className="bg-primary text-white p-6 rounded-2xl shadow-xl flex items-center justify-between hover:scale-[1.02] transition">
            <div>
              <h3 className="font-semibold text-lg">WhatsApp</h3>
              <p className="text-sm opacity-90">+85620 7600 7599</p>
            </div>
            <div className="text-2xl opacity-80">💬</div>
          </div>

          <p className="text-sm text-gray-500 text-center mt-2">
            By clicking the contact us button, you agree to our{" "}
            <u>terms and policy</u>.
          </p>

          <div className="flex justify-center mt-4">
            <button
              onClick={() => setOpen(true)}
              className="px-10 py-3 rounded-full bg-primary text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition"
            >
              Contact Us
            </button>
          </div>
        </aside>
      </main>

      {/* ---------------- Modal ---------------- */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center px-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-slideUp">
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Get in Touch
            </h2>
            <p className="text-gray-600 text-center mt-1">
              We'd love to hear from you! Please fill out the form below.
            </p>

            {/* Form */}
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Message sent (demo)");
                setOpen(false);
              }}
            >
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Firstname
                </label>
                <input
                  required
                  placeholder="Enter your firstname"
                  className="w-full mt-1 p-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  placeholder="20xxxxxxxx"
                  className="w-full mt-1 p-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  className="w-full mt-1 p-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your message here..."
                  className="w-full mt-1 p-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold shadow-lg hover:opacity-95 transition"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
