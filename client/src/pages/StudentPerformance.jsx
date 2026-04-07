import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { TrendingUp, Award, Target, BarChart3, BookOpen } from 'lucide-react';

export default function StudentPerformance() {
  const [performance] = useState({
    gpa: 3.8,
    overallAttendance: 87,
    classAverage: 82,
    subjects: [
      { name: 'Data Structures', attendance: 92, grade: 'A', credits: 4 },
      { name: 'Algorithms', attendance: 85, grade: 'B+', credits: 4 },
      { name: 'Database Systems', attendance: 88, grade: 'A-', credits: 3 },
      { name: 'Web Development', attendance: 82, grade: 'B', credits: 3 },
    ],
  });
  
  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Performance Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Track your academic performance and attendance</p>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Award className="text-purple-600" size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current GPA</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{performance.gpa}</p>
              </div>
              
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Target className="text-green-600" size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Attendance</p>
                <p className="text-4xl font-bold text-green-600">{performance.overallAttendance}%</p>
              </div>
              
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-blue-600" size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Class Average</p>
                <p className="text-4xl font-bold text-blue-600">{performance.classAverage}%</p>
              </div>
              
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-indigo-600" size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Performance</p>
                <p className="text-4xl font-bold text-indigo-600">
                  +{performance.overallAttendance - performance.classAverage}%
                </p>
              </div>
            </div>
            
            {/* Attendance vs Performance Chart */}
            <div className="card-elevated p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Attendance vs Performance Correlation
              </h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500">Chart: Attendance % vs Grades (Line Graph)</p>
              </div>
            </div>
            
            {/* Subject-wise Breakdown */}
            <div className="card-elevated p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Subject-wise Performance</h2>
              <div className="space-y-4">
                {performance.subjects.map((subject, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                          <BookOpen className="text-indigo-600" size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{subject.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{subject.credits} Credits</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Attendance</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{subject.attendance}%</p>
                        </div>
                        <span className={`px-4 py-2 rounded-lg font-bold text-lg ${getGradeColor(subject.grade)}`}>
                          {subject.grade}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
                        style={{ width: `${subject.attendance}%` }}
                      />
                    </div>
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
