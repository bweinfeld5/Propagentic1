import React from 'react';
import { Link } from 'react-router-dom';
import SignupForm from '../components/auth/SignupForm';
import HomeNavLink from '../components/layout/HomeNavLink';

const RegisterPage = ({ initialRole, isPremium }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <HomeNavLink className="text-base flex items-center" />
      </div>
      
      <div className="max-w-md w-full bg-white rounded-lg shadow-md">
        <div className="text-center p-8 pb-0">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <SignupForm initialRole={initialRole} isPremium={isPremium} />
      </div>
    </div>
  );
};

export default RegisterPage; 