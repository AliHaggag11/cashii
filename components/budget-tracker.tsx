"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Pencil, Trash2, Moon, Sun, Filter, X, Calendar, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTheme } from "next-themes"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { format, parseISO, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval, addMonths, isSameMonth, isBefore, isAfter } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

type Entry = {
  id: number
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
  isInstallment?: boolean
  installmentId?: number
  installmentPeriod?: number
  installmentAmount?: number
  isPaid?: boolean
}

type Goal = {
  id: number
  category: string
  amount: number
}

const expenseCategories = ["Food", "Transportation", "Entertainment", "Utilities", "Housing", "Healthcare", "Education", "Personal", "Debt", "Savings", "Installments", "Other"]
const incomeCategories = ["Salary", "Freelance", "Investments", "Rental", "Business", "Gifts", "Other"]
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57', '#ffa07a']

export function BudgetTracker() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(expenseCategories[0])
  const [date, setDate] = useState("")
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense')
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [newGoalCategory, setNewGoalCategory] = useState(expenseCategories[0])
  const [newGoalAmount, setNewGoalAmount] = useState("")
  const [chartTimeframe, setChartTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('monthly')
  const { theme, setTheme } = useTheme()
  const editCardRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState({
    type: [] as ('income' | 'expense')[],
    category: [] as string[],
    dateFrom: '',
    dateTo: '',
  })
  const [installmentPeriod, setInstallmentPeriod] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const today = new Date()

  useEffect(() => {
    const storedEntries = localStorage.getItem('budgetEntries')
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries))
    }
    const storedGoals = localStorage.getItem('budgetGoals')
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('budgetEntries', JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    localStorage.setItem('budgetGoals', JSON.stringify(goals))
  }, [goals])

  const addEntry = () => {
    if (description && amount && date) {
      const newEntry: Entry = {
        id: Date.now(),
        type: entryType,
        description,
        amount: parseFloat(amount),
        category,
        date,
      }

      if (category === 'Installments' && installmentPeriod) {
        const installmentId = Date.now()
        const installmentAmount = parseFloat(amount)
        const installmentEntries: Entry[] = Array.from({ length: parseInt(installmentPeriod) }, (_, index) => ({
          ...newEntry,
          id: Date.now() + index,
          date: format(addMonths(new Date(date), index), 'yyyy-MM-dd'),
          amount: installmentAmount / parseInt(installmentPeriod),
          isInstallment: true,
          installmentId,
          installmentPeriod: parseInt(installmentPeriod),
          installmentAmount,
          isPaid: isBefore(addMonths(new Date(date), index), today),
        }))

        setEntries([...entries, ...installmentEntries])
      } else {
        setEntries([...entries, newEntry])
      }

      resetForm()
    }
  }

  const editEntry = (entry: Entry) => {
    setEditingEntry(entry)
    setDescription(entry.description)
    setAmount(entry.amount.toString())
    setCategory(entry.category)
    setDate(entry.date)
    setEntryType(entry.type)
    if (entry.isInstallment) {
      setInstallmentPeriod(entry.installmentPeriod?.toString() || "")
    }
    editCardRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const updateEntry = () => {
    if (editingEntry && description && amount && date) {
      if (editingEntry.isInstallment) {
        const updatedEntries = entries.map(entry =>
          entry.installmentId === editingEntry.installmentId
            ? {
                ...entry,
                description,
                amount: parseFloat(amount) / (editingEntry.installmentPeriod || 1),
                category,
                installmentAmount: parseFloat(amount),
              }
            : entry
        )
        setEntries(updatedEntries)
      } else {
        const updatedEntries = entries.map(entry =>
          entry.id === editingEntry.id
            ? { ...entry, description, amount: parseFloat(amount), category, date, type: entryType }
            : entry
        )
        setEntries(updatedEntries)
      }
      resetForm()
    }
  }

  const deleteEntry = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id))
  }

  const deleteInstallment = (installmentId: number) => {
    setEntries(entries.filter(entry => entry.installmentId !== installmentId))
  }

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setCategory(entryType === 'expense' ? expenseCategories[0] : incomeCategories[0])
    setDate("")
    setEditingEntry(null)
    setInstallmentPeriod("")
  }

  const addGoal = () => {
    if (newGoalAmount) {
      const newGoal: Goal = {
        id: Date.now(),
        category: newGoalCategory,
        amount: parseFloat(newGoalAmount),
      }
      setGoals([...goals, newGoal])
      setNewGoalCategory(expenseCategories[0])
      setNewGoalAmount("")
    }
  }

  const editGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setNewGoalCategory(goal.category)
    setNewGoalAmount(goal.amount.toString())
  }

  const updateGoal = () => {
    if (editingGoal && newGoalAmount) {
      const updatedGoals = goals.map(goal =>
        goal.id === editingGoal.id
          ? { ...goal, category: newGoalCategory, amount: parseFloat(newGoalAmount) }
          : goal
      )
      setGoals(updatedGoals)
      setEditingGoal(null)
      setNewGoalCategory(expenseCategories[0])
      setNewGoalAmount("")
    }
  }

  const deleteGoal = (id: number) => {
    setGoals(goals.filter(goal => goal.id !== id))
  }

  const filteredEntries = entries.filter(entry => {
    const typeMatch = filters.type.length === 0 || filters.type.includes(entry.type)
    const categoryMatch = filters.category.length === 0 || filters.category.includes(entry.category)
    const dateMatch = (!filters.dateFrom || entry.date >= filters.dateFrom) &&
                      (!filters.dateTo || entry.date <= filters.dateTo)
    const monthMatch = isSameMonth(parseISO(entry.date), parseISO(selectedMonth))
    return typeMatch && categoryMatch && dateMatch && monthMatch
  })

  const getMonthlyTotals = (month: string) => {
    const monthEntries = entries.filter(entry => entry.date.startsWith(month))
    const totalIncome = monthEntries.filter(entry => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
    const totalExpenses = monthEntries.filter(entry => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
    const balance = totalIncome - totalExpenses
    return { totalIncome, totalExpenses, balance }
  }

  const { totalIncome, totalExpenses, balance } = getMonthlyTotals(selectedMonth)

  const expensesByCategory = filteredEntries
    .filter(entry => entry.type === 'expense')
    .reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount
      return acc
    }, {} as Record<string, number>)

  const incomeByCategory = filteredEntries
    .filter(entry => entry.type === 'income')
    .reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount
      return acc
    }, {} as Record<string, number>)

  const expenseChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }))

  const incomeChartData = Object.entries(incomeByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }))

  const getChartData = () => {
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (sortedEntries.length === 0) return []

    const startDate = parseISO(sortedEntries[0].date)
    const endDate = parseISO(sortedEntries[sortedEntries.length - 1].date)

    let dateRange
    let formatString

    switch (chartTimeframe) {
      case 'daily':
        dateRange = eachDayOfInterval({ start: startDate, end: endDate })
        formatString = 'yyyy-MM-dd'
        break
      case 'monthly':
        dateRange = eachMonthOfInterval({ start: startOfYear(startDate), end: endOfYear(endDate) })
        formatString = 'yyyy-MM'
        break
      case 'yearly':
        dateRange = eachYearOfInterval({ start: startDate, end: endDate })
        formatString = 'yyyy'
        break
    }

    const data = dateRange.map(date => {
      const formattedDate = format(date, formatString)
      const dayEntries = entries.filter(entry => entry.date.startsWith(formattedDate))
      const income = dayEntries.filter(entry => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
      const expenses = dayEntries.filter(entry => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
      return {
        name: formattedDate,
        Income: income,
        Expenses: expenses
      }
    })

    return data
  }

  const chartData = getChartData()

  const toggleFilter = (type: 'type' | 'category', value: string) => {
    setFilters(prev => {
      const currentFilters = prev[type] as string[]
      const updatedFilters = currentFilters.includes(value)
        ? currentFilters.filter(item => item !== value)
        : [...currentFilters, value]
      return { ...prev, [type]: updatedFilters }
    })
  }

  const clearFilters = () => {
    setFilters({
      type: [],
      category: [],
      dateFrom: '',
      dateTo: '',
    })
  }

  const installmentEntries = entries.filter(entry => entry.isInstallment)
  const installmentsByDescription = installmentEntries.reduce((acc, entry) => {
    if (!acc[entry.description]) {
      acc[entry.description] = {
        installmentId: entry.installmentId,
        totalAmount: entry.installmentAmount || 0,
        paidAmount: 0,
        remainingAmount: entry.installmentAmount || 0,
        period: entry.installmentPeriod || 0,
        paidPeriods: 0,
        entries: [],
      }
    }
    acc[entry.description].entries.push(entry)
    if (entry.isPaid) {
      acc[entry.description].paidAmount += entry.amount
      acc[entry.description].remainingAmount -= entry.amount
      acc[entry.description].paidPeriods++
    }
    return acc
  }, {} as Record<string, { installmentId: number, totalAmount: number, paidAmount: number, remainingAmount: number, period: number, paidPeriods: number, entries: Entry[] }>)

  const toggleInstallmentPaid = (installmentId: number, entryId: number) => {
    setEntries(entries.map(entry =>
      entry.id === entryId ? { ...entry, isPaid: !entry.isPaid } : entry
    ))
  }

  const getMonthOptions = () => {
    const startDate = parseISO(entries[0]?.date || format(new Date(), 'yyyy-MM-dd'))
    const endDate = parseISO(entries[entries.length - 1]?.date || format(new Date(), 'yyyy-MM-dd'))
    const months = eachMonthOfInterval({ start: startDate, end: endDate })
    return months.map(date => format(date, 'yyyy-MM'))
  }

  return (
    <div className="container mx-auto p-4">
      <nav className="bg-[#171717] rounded-lg mt-0 mb-6">
    <div className="flex justify-between items-center py-6 px-4 ">
      <h1 className="text-3xl font-bold text-white">Cashi</h1>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="bg-transparent border-transparent"
      >
        {theme === "dark" ? (
          <Sun className="h-[1.2rem] w-[1.2rem] text-white" />
        ) : (
          <Moon className="h-[1.2rem] w-[1.2rem] text-white" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  </nav>
      
      <Card className="mb-8 ">
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Your financial status for {format(parseISO(selectedMonth), 'MMMM yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="font-semibold">Total Income</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">EGP  {totalIncome.toFixed(2)}</p>
              </div>
              <div>
                <p className="font-semibold">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">-EGP {totalExpenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="font-semibold">Current Balance</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  EGP {balance.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Income Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={incomeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {incomeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Expense Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>Income vs Expenses</CardTitle>
                  <Select value={chartTimeframe} onValueChange={(value: 'daily' | 'monthly' | 'yearly') => setChartTimeframe(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Income" fill="#82ca9d" />
                    <Bar dataKey="Expenses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-8 md:grid-cols-2 mb-8">
        <Card ref={editCardRef}>
          <CardHeader>
            <CardTitle>{editingEntry ? 'Edit Entry' : 'Add Entry'}</CardTitle>
            <CardDescription>Enter your income or expense details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entryType" className="text-right">
                  Type
                </Label>
                <Select value={entryType} onValueChange={(value: 'income' | 'expense') => {
                  setEntryType(value)
                  setCategory(value === 'income' ? incomeCategories[0] : expenseCategories[0])
                }}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(entryType === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {category === 'Installments' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="installmentPeriod" className="text-right">
                    Period (months)
                  </Label>
                  <Input
                    id="installmentPeriod"
                    type="number"
                    value={installmentPeriod}
                    onChange={(e) => setInstallmentPeriod(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {editingEntry ? (
              <>
                <Button onClick={updateEntry}>Update Entry</Button>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </>
            ) : (
              <Button onClick={addEntry}>Add Entry</Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Goals</CardTitle>
            <CardDescription>Set and track your budget goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map(goal => (
                <div key={goal.id} className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between items-center mb-2">
                      <Label>{goal.category}</Label>
                      <span>EGP {goal.amount.toFixed(2)}</span>
                    </div>
                    <Progress
                      value={(expensesByCategory[goal.category] || 0) / goal.amount * 100}
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      EGP {expensesByCategory[goal.category] || 0} / ${goal.amount}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => editGoal(goal)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => deleteGoal(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2">
                <Select value={newGoalCategory} onValueChange={setNewGoalCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={newGoalAmount}
                  onChange={(e) => setNewGoalAmount(e.target.value)}
                  placeholder="Amount"
                />
                <Button onClick={editingGoal ? updateGoal : addGoal}>
                  {editingGoal ? 'Update' : 'Add'} Goal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Installment Tracker</CardTitle>
          <CardDescription>Track your ongoing installments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(installmentsByDescription).map(([description, data]) => (
              <div key={data.installmentId} className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{description}</h3>
                  <span className="text-sm text-muted-foreground">
                    {data.paidPeriods} / {data.period} months
                  </span>
                </div>
                <Progress
                  value={(data.paidAmount / data.totalAmount) * 100}
                  className="h-2 mb-2"
                />
                <div className="flex justify-between text-sm mb-2">
                  <span>Paid: EGP {data.paidAmount.toFixed(2)}</span>
                  <span>Remaining: EGP {data.remainingAmount.toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.entries.map((entry) => (
                    <Button
                      key={entry.id}
                      variant={entry.isPaid ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleInstallmentPaid(data.installmentId, entry.id)}
                    >
                      {format(parseISO(entry.date), 'MMM yyyy')}
                      {entry.isPaid && <Check className="ml-2 h-4 w-4" />}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-end mt-2">
                  <Button variant="outline" size="sm" onClick={() => editEntry(data.entries[0])}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="ml-2" onClick={() => deleteInstallment(data.installmentId)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Transactions</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map((month) => (
                    <SelectItem key={month} value={month}>
                      {format(parseISO(month), 'MMMM yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Type</h4>
                      <div className="flex flex-col space-y-1">
                        <Label className="flex items-center space-x-2">
                          <Checkbox checked={filters.type.includes('income')} onCheckedChange={() => toggleFilter('type', 'income')} />
                          <span>Income</span>
                        </Label>
                        <Label className="flex items-center space-x-2">
                          <Checkbox checked={filters.type.includes('expense')} onCheckedChange={() => toggleFilter('type', 'expense')} />
                          <span>Expense</span>
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Category</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[...expenseCategories, ...incomeCategories].map(cat => (
                          <Label key={cat} className="flex items-center space-x-2">
                            <Checkbox checked={filters.category.includes(cat)} onCheckedChange={() => toggleFilter('category', cat)} />
                            <span>{cat}</span>
                          </Label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Date Range</h4>
                      <div className="grid gap-2">
                        <Label className="flex items-center space-x-2">
                          From
                          <Input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                          />
                        </Label>
                        <Label className="flex items-center space-x-2">
                          To
                          <Input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                          />
                        </Label>
                      </div>
                    </div>
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <CardDescription>Your income and expense entries for {format(parseISO(selectedMonth), 'MMMM yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell className={`text-right ${entry.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {entry.type === 'income' ? '+' : '-'}EGP {entry.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => editEntry(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Are you sure you want to delete this entry?</DialogTitle>
                              <DialogDescription>
                                This action cannot be undone. This will permanently delete the entry.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => deleteEntry(entry.id)}>
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}