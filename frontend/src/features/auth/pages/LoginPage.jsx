import React, { useState } from 'react';
import LoginForm from '../components/LoginForm.jsx';
import RegisterForm from '../components/RegisterForm.jsx';
import { Shield, Truck, Users, Landmark } from 'lucide-react';

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-bg-primary text-gray-200">
      {/* Left Panel: Branding & Details */}
      <div className="w-full md:w-[45%] bg-[#1c1c1c] border-b md:border-b-0 md:border-r border-border-thin flex flex-col justify-between p-8 md:p-12">
        <div className="flex flex-col gap-6">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-orange/10 rounded-sm border border-accent-orange/30">
              <Truck className="h-8 w-8 text-accent-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">TransitOps</h1>
              <p className="text-xs text-gray-500 font-sans">Smart Transport Operations Platform</p>
            </div>
          </div>

          {/* Details list */}
          <div className="flex flex-col gap-5 mt-10 md:mt-16">
            <h2 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
              One login, four roles:
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <Truck className="h-5 w-5 text-accent-orange mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-300">Fleet Manager</h3>
                  <p className="text-xs text-gray-500">Oversees fleet assets, maintenance, vehicle registry and operational efficiency.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Users className="h-5 w-5 text-accent-orange mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-300">Dispatcher</h3>
                  <p className="text-xs text-gray-500">Creates trips, assigns vehicles and drivers, and monitors active deliveries.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Shield className="h-5 w-5 text-accent-orange mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-300">Safety Officer</h3>
                  <p className="text-xs text-gray-500">Ensures driver compliance, tracks license validity, and monitors safety scores.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Landmark className="h-5 w-5 text-accent-orange mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-300">Financial Analyst</h3>
                  <p className="text-xs text-gray-500">Reviews operational expenses, fuel consumption, maintenance costs, and profitability.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-0 text-[10px] text-gray-600 uppercase tracking-widest">
          TRANSITOPS © 2026 · RBAC ENABLED
        </div>
      </div>

      {/* Right Panel: Sign-In / Register Form */}
      <div className="w-full md:w-[55%] flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isLogin ? 'Sign in to your account' : 'Create an account'}
            </h2>
            <p className="text-sm text-gray-500">
              {isLogin ? 'Enter your credentials to continue' : 'Register a new administrator/operator profile'}
            </p>
          </div>

          <div className="border-t border-border-thin my-1" />

          {/* Mount the active form */}
          {isLogin ? <LoginForm /> : <RegisterForm onToggle={() => setIsLogin(true)} />}

          <div className="text-center mt-2">
            <button
              onClick={() => setIsLogin((prev) => !prev)}
              className="text-xs text-accent-orange hover:underline cursor-pointer select-none"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </button>
          </div>

          <div className="border-t border-border-thin my-2" />

          <div className="flex flex-col gap-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-400">Access is scoped by role after login:</span>
            <span>• Fleet Manager → Fleet, Maintenance, Configs</span>
            <span>• Dispatcher → Book Trips, Assign Drivers, Operations</span>
            <span>• Safety Officer → Compliance registries, Safety profiles</span>
            <span>• Financial Analyst → Expenses ledgers, Performance ROI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
