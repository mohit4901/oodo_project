import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  useFuelLogsList,
  useExpensesList,
  useLogFuel,
  useLogExpense,
} from '../hooks/useExpenses.js';
import { useVehiclesList } from '../../vehicle-registry/hooks/useVehicles.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import { Fuel, DollarSign, Plus, X, Calendar, FileText } from 'lucide-react';

// Zod schemas
const fuelSchema = zod.object({
  vehicle: zod.string().nonempty('Please select a vehicle'),
  liters: zod.coerce.number().positive('Liters must be a positive number'),
  cost: zod.coerce.number().positive('Cost must be a positive number'),
  date: zod.string().nonempty('Purchase date is required'),
});

const expenseSchema = zod.object({
  vehicle: zod.string().nonempty('Please select a vehicle'),
  category: zod.enum(['Fuel', 'Maintenance', 'Tolls', 'Repair', 'Insurance', 'Driver Payout', 'Other'], {
    errorMap: () => ({ message: 'Please select a valid expense category' }),
  }),
  cost: zod.coerce.number().positive('Cost must be a positive amount'),
  date: zod.string().nonempty('Expense date is required'),
  description: zod.string().optional(),
});

export const FuelExpensePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'fuel'

  const [fuelPage, setFuelPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Queries
  const { data: fuelData, isLoading: loadingFuel } = useFuelLogsList({
    page: fuelPage,
    limit: 10,
    vehicleId: selectedVehicle,
  });

  const { data: expenseData, isLoading: loadingExpenses } = useExpensesList({
    page: expensePage,
    limit: 10,
    vehicleId: selectedVehicle,
    category: selectedCategory,
  });

  const { data: vehiclesData } = useVehiclesList({ limit: 100, status: 'Available' });
  const allVehicles = vehiclesData?.data || [];

  // Mutations
  const { mutate: logFuel, isPending: loggingFuel } = useLogFuel();
  const { mutate: logExpense, isPending: loggingExpense } = useLogExpense();

  // Forms
  const {
    register: registerFuel,
    handleSubmit: handleSubmitFuel,
    reset: resetFuel,
    formState: { errors: fuelErrors },
  } = useForm({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      vehicle: '',
      liters: '',
      cost: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const {
    register: registerExpense,
    handleSubmit: handleSubmitExpense,
    reset: resetExpense,
    formState: { errors: expenseErrors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicle: '',
      category: '',
      cost: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const handleFuelSubmit = (data) => {
    logFuel(data, {
      onSuccess: () => {
        setIsFuelModalOpen(false);
        resetFuel();
      },
    });
  };

  const handleExpenseSubmit = (data) => {
    logExpense(data, {
      onSuccess: () => {
        setIsExpenseModalOpen(false);
        resetExpense();
      },
    });
  };

  const isFinancialStaff = ['admin', 'fleet_manager', 'financial_analyst'].includes(user?.role);
  
  const expenses = expenseData?.data || [];
  const expensesPagination = expenseData?.pagination || { page: 1, pages: 1, total: 0 };

  const fuelLogs = fuelData?.data || [];
  const fuelPagination = fuelData?.pagination || { page: 1, pages: 1, total: 0 };

  // Summarize cumulative operational totals from the data loaded on ledger
  const totalExpenseSum = expenses.reduce((acc, curr) => acc + curr.cost, 0);
  const totalFuelSum = fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">FUEL & EXPENSE LEDGER</h1>
          <p className="text-xs text-gray-500">Track fuel cards, record tolls, and monitor operational costs</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsFuelModalOpen(true)}>
            <Fuel className="h-4 w-4 mr-2" />
            Log Fuel
          </Button>
          {isFinancialStaff && (
            <Button variant="primary" size="sm" onClick={() => setIsExpenseModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Expense
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-accent-orange/10 rounded-sm border border-accent-orange/20">
            <DollarSign className="h-5 w-5 text-accent-orange" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Total Ledger Expenses</span>
            <span className="text-xl font-bold text-white leading-none">
              ${totalExpenseSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-950/20 rounded-sm border border-blue-800/30">
            <Fuel className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Total Fuel Logged</span>
            <span className="text-xl font-bold text-white leading-none">
              ${totalFuelSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-950/20 rounded-sm border border-emerald-800/30">
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Combined Cost</span>
            <span className="text-xl font-bold text-white leading-none">
              ${(totalExpenseSum + totalFuelSum).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>
      </div>

      {/* Navigation tabs & Filters */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-thin bg-[#171717] px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer select-none ${
                activeTab === 'expenses' ? 'border-accent-orange text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              General Expenses
            </button>
            <button
              onClick={() => setActiveTab('fuel')}
              className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer select-none ${
                activeTab === 'fuel' ? 'border-accent-orange text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Fuel Purchases
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 py-2">
            <Select
              placeholder="All Vehicles"
              options={allVehicles.map((v) => ({ value: v._id, label: v.registrationNumber }))}
              value={selectedVehicle}
              onChange={(e) => {
                setSelectedVehicle(e.target.value);
                setFuelPage(1);
                setExpensePage(1);
              }}
              className="w-40 bg-[#121212] text-xs py-1"
            />
            {activeTab === 'expenses' && (
              <Select
                placeholder="All Categories"
                options={[
                  { value: 'Fuel', label: 'Fuel' },
                  { value: 'Maintenance', label: 'Maintenance' },
                  { value: 'Tolls', label: 'Tolls' },
                  { value: 'Repair', label: 'Repairs' },
                  { value: 'Insurance', label: 'Insurance' },
                  { value: 'Driver Payout', label: 'Driver Payouts' },
                  { value: 'Other', label: 'Other' },
                ]}
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setExpensePage(1);
                }}
                className="w-40 bg-[#121212] text-xs py-1"
              />
            )}
          </div>
        </div>

        {/* Tab 1: Expenses List */}
        {activeTab === 'expenses' && (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-thin text-gray-400 uppercase tracking-wider bg-[#131313]/40">
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-thin">
                  {loadingExpenses ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse h-10 bg-[#1a1a1a]/10" />
                    ))
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-600">
                        No expense ledger items found.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="p-4 font-semibold text-white">
                          {expense.vehicle?.registrationNumber || 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-sm border border-border-thin text-[10px] font-semibold bg-[#2a2a2a]/20 text-gray-300">
                            {expense.category}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 max-w-xs truncate" title={expense.description}>
                          {expense.description || '--'}
                        </td>
                        <td className="p-4 text-gray-400">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right font-semibold text-white">
                          ${expense.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {expensesPagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border-thin bg-[#171717]">
                <span className="text-[11px] text-gray-500">
                  Showing page {expensesPagination.page} of {expensesPagination.pages} ({expensesPagination.total} items)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={expensePage === 1}
                    onClick={() => setExpensePage((prev) => prev - 1)}
                    className="py-1 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={expensePage === expensesPagination.pages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="py-1 px-3 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Fuel Logs List */}
        {activeTab === 'fuel' && (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-thin text-gray-400 uppercase tracking-wider bg-[#131313]/40">
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Liters Consumed</th>
                    <th className="p-4">Fuel Rate ($/L)</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-thin">
                  {loadingFuel ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse h-10 bg-[#1a1a1a]/10" />
                    ))
                  ) : fuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-600">
                        No fuel log items found.
                      </td>
                    </tr>
                  ) : (
                    fuelLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="p-4 font-semibold text-white">
                          {log.vehicle?.registrationNumber || 'N/A'}
                        </td>
                        <td className="p-4 text-gray-300 font-mono">{log.liters} L</td>
                        <td className="p-4 text-gray-400">
                          ${(log.cost / log.liters).toFixed(2)} / L
                        </td>
                        <td className="p-4 text-gray-400">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right font-semibold text-white">
                          ${log.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {fuelPagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border-thin bg-[#171717]">
                <span className="text-[11px] text-gray-500">
                  Showing page {fuelPagination.page} of {fuelPagination.pages} ({fuelPagination.total} items)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={fuelPage === 1}
                    onClick={() => setFuelPage((prev) => prev - 1)}
                    className="py-1 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={fuelPage === fuelPagination.pages}
                    onClick={() => setFuelPage((prev) => prev + 1)}
                    className="py-1 px-3 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Log Fuel Modal Form */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm relative border-border-thin p-6 flex flex-col gap-5">
            <button
              onClick={() => setIsFuelModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Log Fuel Purchase</h3>
              <p className="text-[11px] text-gray-500">Logs fuel card purchases mirrored in operational expense ledger</p>
            </div>

            <form onSubmit={handleSubmitFuel(handleFuelSubmit)} className="flex flex-col gap-4">
              <Select
                label="Select Vehicle"
                placeholder="Select vehicle"
                error={fuelErrors.vehicle?.message}
                disabled={loggingFuel}
                {...registerFuel('vehicle')}
              >
                {allVehicles.map((v) => (
                  <option key={v._id} value={v._id} className="bg-[#1f1f1f] text-gray-200">
                    {v.vehicleName} ({v.registrationNumber})
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Liters Purchased"
                  type="number"
                  placeholder="50"
                  error={fuelErrors.liters?.message}
                  disabled={loggingFuel}
                  {...registerFuel('liters')}
                />
                <Input
                  label="Total Cost ($)"
                  type="number"
                  placeholder="150"
                  error={fuelErrors.cost?.message}
                  disabled={loggingFuel}
                  {...registerFuel('cost')}
                />
              </div>

              <Input
                label="Purchase Date"
                type="date"
                error={fuelErrors.date?.message}
                disabled={loggingFuel}
                {...registerFuel('date')}
              />

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setIsFuelModalOpen(false)} disabled={loggingFuel}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loggingFuel}>
                  Log Fuel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Log Expense Modal Form */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm relative border-border-thin p-6 flex flex-col gap-5">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Log Operation Expense</h3>
              <p className="text-[11px] text-gray-500">Record tolls, insurance, repairs, or driver payouts</p>
            </div>

            <form onSubmit={handleSubmitExpense(handleExpenseSubmit)} className="flex flex-col gap-4">
              <Select
                label="Select Vehicle"
                placeholder="Select vehicle"
                error={expenseErrors.vehicle?.message}
                disabled={loggingExpense}
                {...registerExpense('vehicle')}
              >
                {allVehicles.map((v) => (
                  <option key={v._id} value={v._id} className="bg-[#1f1f1f] text-gray-200">
                    {v.vehicleName} ({v.registrationNumber})
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Expense Category"
                  placeholder="Select category"
                  options={[
                    { value: 'Fuel', label: 'Fuel' },
                    { value: 'Maintenance', label: 'Maintenance' },
                    { value: 'Tolls', label: 'Tolls' },
                    { value: 'Repair', label: 'Repairs' },
                    { value: 'Insurance', label: 'Insurance' },
                    { value: 'Driver Payout', label: 'Driver Payout' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  error={expenseErrors.category?.message}
                  disabled={loggingExpense}
                  {...registerExpense('category')}
                />

                <Input
                  label="Cost Bill Amount ($)"
                  type="number"
                  placeholder="85"
                  error={expenseErrors.cost?.message}
                  disabled={loggingExpense}
                  {...registerExpense('cost')}
                />
              </div>

              <Input
                label="Expense Date"
                type="date"
                error={expenseErrors.date?.message}
                disabled={loggingExpense}
                {...registerExpense('date')}
              />

              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Comments (Optional)</label>
                <textarea
                  placeholder="Details of toll location, invoice ref..."
                  className="w-full h-20 bg-[#121212] border border-border-thin text-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-orange focus:border-accent-orange placeholder:text-gray-600"
                  disabled={loggingExpense}
                  {...registerExpense('description')}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setIsExpenseModalOpen(false)} disabled={loggingExpense}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loggingExpense}>
                  Log Expense
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FuelExpensePage;
