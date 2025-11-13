// Debug component to view VNPay callback params
import React from "react";
import { useSearchParams } from "react-router-dom";

export default function VNPayDebug() {
  const [searchParams] = useSearchParams();
  
  const params = {};
  for (let [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-6">VNPay Debug Info</h1>
        
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Current URL:</h2>
          <code className="block bg-gray-100 p-3 rounded overflow-x-auto">
            {window.location.href}
          </code>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Query Parameters:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(params, null, 2)}
          </pre>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Important Params:</h2>
          <table className="w-full border">
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-semibold">Response Code:</td>
                <td className="p-2">{params.vnp_ResponseCode || 'N/A'}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-semibold">Transaction Ref:</td>
                <td className="p-2">{params.vnp_TxnRef || 'N/A'}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-semibold">Amount:</td>
                <td className="p-2">{params.vnp_Amount ? (parseInt(params.vnp_Amount) / 100).toLocaleString() + ' VND' : 'N/A'}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-semibold">SecureHash:</td>
                <td className="p-2 break-all">{params.vnp_SecureHash || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <a 
            href="/" 
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
