import React, { useState } from "react";
import axios from "axios";

export default function PaymentComponent() {
  const [username, setUsername] = useState("");
  const [route, setRoute] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/payment/pay", {
        username,
        route,
        isStudent,
      });
      setMessage(res.data.message + ` Remaining Balance: NPR ${res.data.remainingBalance}`);
    } catch (err) {
      setMessage(err.response.data);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">TravelPulse Payment</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full border p-2 mb-2"
      />
      <input
        type="text"
        placeholder="Route (e.g., Kathmandu-Pokhara)"
        value={route}
        onChange={(e) => setRoute(e.target.value)}
        className="w-full border p-2 mb-2"
      />
      <label className="flex items-center mb-2">
        <input
          type="checkbox"
          checked={isStudent}
          onChange={(e) => setIsStudent(e.target.checked)}
        />
        <span className="ml-2">Apply Student Discount (20%)</span>
      </label>
      <button
        onClick={handlePayment}
        className="w-full bg-blue-500 text-white py-2 rounded"
      >
        Pay Fare
      </button>
      {message && (
        <div className="mt-4 p-2 bg-gray-100 text-center">{message}</div>
      )}
    </div>
  );
}
