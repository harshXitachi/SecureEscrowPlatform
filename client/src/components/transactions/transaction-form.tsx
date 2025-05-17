import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, BrokerRequest } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, UserCircle, DollarSign, Calendar } from "lucide-react";

interface TransactionFormProps {
  selectedBuyerId?: number;
  selectedSellerId?: number;
  onTransactionCreated?: (transactionId: number) => void;
  onCancel?: () => void;
}

export default function TransactionForm({
  selectedBuyerId,
  selectedSellerId,
  onTransactionCreated,
  onCancel
}: TransactionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState("");
  const [buyerId, setBuyerId] = useState<number | undefined>(selectedBuyerId);
  const [sellerId, setSellerId] = useState<number | undefined>(selectedSellerId);
  
  // State for milestones
  const [milestones, setMilestones] = useState([
    { title: "", description: "", amount: "", dueDate: "" }
  ]);
  
  // State for loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch all users to select buyers and sellers
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !selectedBuyerId || !selectedSellerId, // Only fetch if we don't have both buyer and seller
  });
  
  // Fetch buyer requests if we're a broker
  const { data: brokerRequests } = useQuery<BrokerRequest[]>({
    queryKey: ["/api/broker-requests"],
    enabled: !!user && user.role === "broker",
  });
  
  // Filter users by role
  const buyers = users?.filter(u => u.role === "buyer" || u.role === "user") || [];
  const sellers = users?.filter(u => u.role === "seller" || u.role === "user") || [];
  
  // Get pending broker requests (accepted requests that haven't been turned into transactions yet)
  const pendingRequests = brokerRequests?.filter(req => req.status === "accepted") || [];

  // Mutation for creating transaction
  const createTransaction = useMutation({
    mutationFn: async (transactionData: any) => {
      // In a real app, we would call the API
      // For now, simulate a successful creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: Math.floor(Math.random() * 1000) + 1 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Transaction Created",
        description: "The escrow transaction has been created successfully.",
        variant: "default",
      });
      if (onTransactionCreated) {
        onTransactionCreated(data.id);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  // Add a new milestone
  const addMilestone = () => {
    setMilestones([...milestones, { title: "", description: "", amount: "", dueDate: "" }]);
  };

  // Remove a milestone
  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  // Update a milestone
  const updateMilestone = (index: number, field: string, value: string) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value
    };
    setMilestones(updatedMilestones);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !amount || !buyerId || !sellerId || !dueDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate milestones
    const milestonesValid = milestones.every(m => m.title && m.amount && m.dueDate);
    if (!milestonesValid) {
      toast({
        title: "Invalid Milestones",
        description: "Please fill in all milestone fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate total milestone amount
    const milestonesTotal = milestones.reduce((sum, m) => sum + parseFloat(m.amount || "0"), 0);
    const totalAmount = parseFloat(amount);
    
    if (Math.abs(milestonesTotal - totalAmount) > 0.01) {
      toast({
        title: "Amount Mismatch",
        description: "The sum of milestone amounts must equal the total transaction amount.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const transactionData = {
      title,
      description,
      amount,
      currency,
      dueDate,
      buyerId,
      sellerId,
      brokerId: user?.id,
      milestones: milestones.map(m => ({
        ...m,
        status: "pending"
      }))
    };
    
    createTransaction.mutate(transactionData);
  };

  return (
    <GlassCard className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Create New Transaction</h2>
          
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">Pending Buyer Requests</h3>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {pendingRequests.map(request => (
                    <div 
                      key={request.id} 
                      className="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setBuyerId(request.buyerId)}
                    >
                      <div className="flex items-center">
                        <UserCircle className="w-6 h-6 text-blue-400 mr-2" />
                        <div>
                          <p className="text-white">{request.buyer.username}</p>
                          <p className="text-white/60 text-xs">Request ID: {request.id}</p>
                        </div>
                      </div>
                      <GlassButton 
                        variant="outline" 
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBuyerId(request.buyerId);
                        }}
                      >
                        Select
                      </GlassButton>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="buyer" className="block text-white/70 text-sm mb-2">
                Buyer *
              </label>
              <select
                id="buyer"
                className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                value={buyerId || ""}
                onChange={(e) => setBuyerId(parseInt(e.target.value) || undefined)}
                required
              >
                <option value="">Select a buyer</option>
                {buyers.map(buyer => (
                  <option key={buyer.id} value={buyer.id}>
                    {buyer.username}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="seller" className="block text-white/70 text-sm mb-2">
                Seller *
              </label>
              <select
                id="seller"
                className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                value={sellerId || ""}
                onChange={(e) => setSellerId(parseInt(e.target.value) || undefined)}
                required
              >
                <option value="">Select a seller</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="title" className="block text-white/70 text-sm mb-2">
              Transaction Title *
            </label>
            <GlassInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Website Development Project"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-white/70 text-sm mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the transaction details..."
              className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="amount" className="block text-white/70 text-sm mb-2">
                Total Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-white/40" />
                </div>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full py-3 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                  required
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-white/70 text-sm mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-white/70 text-sm mb-2">
                Due Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-white/40" />
                </div>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-medium">Milestones</h3>
              <button
                type="button"
                onClick={addMilestone}
                className="text-primary flex items-center text-sm hover:underline"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Milestone
              </button>
            </div>
            
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="bg-white/5 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-medium">Milestone {index + 1}</h4>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-white/70 text-xs mb-1">
                        Title *
                      </label>
                      <GlassInput
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        placeholder="e.g. Initial Design"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-xs mb-1">
                        Amount *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-white/40" />
                        </div>
                        <input
                          type="number"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full py-3 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                          required
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-xs mb-1">
                        Description
                      </label>
                      <textarea
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        placeholder="Describe this milestone..."
                        className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary min-h-[60px]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-xs mb-1">
                        Due Date *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <Calendar className="h-4 w-4 text-white/40" />
                        </div>
                        <input
                          type="date"
                          value={milestone.dueDate}
                          onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                          className="w-full py-3 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <GlassButton
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </GlassButton>
          )}
          
          <GlassButton
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Transaction'
            )}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}
