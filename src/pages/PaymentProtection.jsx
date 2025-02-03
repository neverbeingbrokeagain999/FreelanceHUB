import React from 'react';

    function PaymentProtection() {
      return (
        <div className="min-h-screen bg-light py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-dark mb-4 font-serif">Payment Protection</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Learn about our secure payment system and how we protect your transactions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 font-serif">Secure Transactions</h2>
              <p className="text-gray-700 mb-4">
                We provide a secure payment system to ensure safe transactions for both clients and freelancers.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-4">
                <li>
                  <strong>Escrow Service:</strong> Funds are held securely until the project is completed to your satisfaction.
                </li>
                <li>
                  <strong>Multiple Payment Options:</strong> Choose from various payment methods, including credit cards and PayPal.
                </li>
                <li>
                  <strong>Dispute Resolution:</strong> We offer a dispute resolution process to handle any issues that may arise.
                </li>
                <li>
                  <strong>Transparent Fees:</strong> Clear and transparent fee structure with no hidden charges.
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    export default PaymentProtection;
