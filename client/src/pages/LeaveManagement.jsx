import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FileText, Upload, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function LeaveManagement() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requests] = useState([
    {
      id: 1,
      type: 'Medical Leave',
      date: '2024-12-20',
      reason: 'Fever and cold',
      status: 'approved',
      submittedOn: '2024-12-18',
      certificate: 'medical_cert.pdf',
    },
    {
      id: 2,
      type: 'Personal Leave',
      date: '2024-12-15',
      reason: 'Family emergency',
      status: 'pending',
      submittedOn: '2024-12-14',
      certificate: null,
    },
    {
      id: 3,
      type: 'Attendance Appeal',
      date: '2024-12-10',
      reason: 'System error - attendance not marked',
      status: 'rejected',
      submittedOn: '2024-12-11',
      certificate: null,
    },
  ]);
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
            <CheckCircle size={16} />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-semibold">
            <Clock size={16} />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-semibold">
            <XCircle size={16} />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Leave & Appeals
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Request leave or appeal for missed attendance</p>
              </div>
              <button
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="btn-primary self-start sm:self-auto"
              >
                {showRequestForm ? 'Cancel' : 'New Request'}
              </button>
            </div>
            
            {/* Request Form */}
            {showRequestForm && (
              <div className="card-elevated p-6 mb-8">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Submit New Request</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Request Type
                    </label>
                    <select className="input-primary">
                      <option>Medical Leave</option>
                      <option>Personal Leave</option>
                      <option>Attendance Appeal</option>
                      <option>Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Date
                    </label>
                    <input type="date" className="input-primary" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Reason
                    </label>
                    <textarea
                      rows="4"
                      className="input-primary"
                      placeholder="Explain your reason..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Upload Certificate (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                      <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</p>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">
                      Submit Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Requests List */}
            <div className="card-elevated p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Your Requests</h2>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="text-indigo-600" size={20} />
                          <h3 className="font-bold text-gray-900 dark:text-white">{request.type}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {request.reason}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>Date: {new Date(request.date).toLocaleDateString()}</span>
                          <span>Submitted: {new Date(request.submittedOn).toLocaleDateString()}</span>
                          {request.certificate && (
                            <span className="text-indigo-600">📎 {request.certificate}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {request.status === 'rejected' && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
                          <p className="text-sm text-red-700 dark:text-red-400">
                            Rejection Reason: Insufficient documentation provided
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
