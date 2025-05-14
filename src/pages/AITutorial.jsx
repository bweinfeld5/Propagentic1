import React from 'react';
import { Link } from 'react-router-dom';

const AITutorial = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Integration Tutorial</h1>
      
      <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p className="text-lg">This page explains how AI is integrated throughout the Propagentic platform to automate maintenance workflows.</p>
      </div>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Automated Maintenance Classification</h2>
          <p className="mb-3">Our AI automatically categorizes maintenance requests based on the description provided by tenants.</p>
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
            <p className="mb-2 font-medium">Example:</p>
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-gray-700 italic">"There's water leaking from under my kitchen sink"</p>
              <div className="mt-2 flex items-center">
                <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded">AI Classification: Plumbing Issue → Urgent</span>
                <span className="text-sm text-gray-500 ml-2">Confidence: 94%</span>
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-3">Contractor Matching</h2>
          <p className="mb-3">Based on the classification, our AI automatically matches the right contractor for the job.</p>
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
            <div className="flex items-start mb-2">
              <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                <span className="text-gray-700 font-bold">JD</span>
              </div>
              <div>
                <p className="font-medium">John's Plumbing Services</p>
                <div className="flex items-center">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="text-sm text-gray-500 ml-1">4.9 (48 reviews)</span>
                </div>
              </div>
              <div className="ml-auto">
                <span className="text-sm bg-green-100 text-green-800 py-1 px-2 rounded">98% Match Score</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">AI matched based on: proximity, expertise in kitchen plumbing, availability, and previous performance metrics</p>
          </div>
        </section>
        
        <div className="mt-8">
          <Link to="/ai-examples" className="text-indigo-600 hover:text-indigo-800 font-medium">
            View practical AI examples →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AITutorial; 