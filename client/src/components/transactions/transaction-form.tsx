import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export type TransactionFormStep = 1 | 2 | 3;

interface TransactionFormData {
  title: string;
  type: string;
  description: string;
  amount: string;
  currency: string;
  dueDate: string;
  sellerEmail: string;
  milestones: Array<{
    title: string;
    description: string;
    amount: string;
    dueDate: string;
  }>;
}

const initialFormData: TransactionFormData = {
  title: "",
  type: "service",
  description: "",
  amount: "",
  currency: "USD",
  dueDate: "",
  sellerEmail: "",
  milestones: [],
};

export default function TransactionForm() {
  const [step, setStep] = useState<TransactionFormStep>(1);
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Progress indicator values
  const stepProgress = {
    1: 33,
    2: 66,
    3: 100,
  };

  // Function to update form data
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Function to add a milestone
  const addMilestone = () => {
    const newMilestone = {
      title: "",
      description: "",
      amount: "",
      dueDate: "",
    };
    
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone],
    }));
  };

  // Function to update milestone data
  const updateMilestone = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const updatedMilestones = [...prev.milestones];
      updatedMilestones[index] = {
        ...updatedMilestones[index],
        [field]: value,
      };
      return {
        ...prev,
        milestones: updatedMilestones,
      };
    });
  };

  // Function to remove a milestone
  const removeMilestone = (index: number) => {
    setFormData((prev) => {
      const updatedMilestones = [...prev.milestones];
      updatedMilestones.splice(index, 1);
      return {
        ...prev,
        milestones: updatedMilestones,
      };
    });
  };

  // Function to continue to next step
  const nextStep = () => {
    // Validation for first step
    if (step === 1) {
      if (!formData.title || !formData.description || !formData.amount || !formData.sellerEmail) {
        toast({
          title: "Missing information",
          description: "Please fill out all required fields",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validation for milestones step
    if (step === 2) {
      if (formData.milestones.length === 0) {
        toast({
          title: "No milestones",
          description: "Please add at least one milestone",
          variant: "destructive",
        });
        return;
      }
      
      // Check if all milestone fields are filled
      const incompleteMilestones = formData.milestones.some(
        m => !m.title || !m.description || !m.amount || !m.dueDate
      );
      
      if (incompleteMilestones) {
        toast({
          title: "Incomplete milestones",
          description: "Please complete all milestone details",
          variant: "destructive",
        });
        return;
      }
    }
    
    setStep((prev) => (prev < 3 ? (prev + 1) as TransactionFormStep : prev));
  };

  // Function to go back to previous step
  const prevStep = () => {
    setStep((prev) => (prev > 1 ? (prev - 1) as TransactionFormStep : prev));
  };

  // Function to submit the form
  const handleSubmit = async () => {
    try {
      // Call API to create transaction
      const response = await apiRequest("POST", "/api/transactions", formData);
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your transaction has been created.",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem creating your transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <GlassCard className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-outfit font-semibold">
          {step === 1
            ? "Transaction Details"
            : step === 2
            ? "Define Milestones"
            : "Review & Confirm"}
        </h3>
        <div className="flex items-center gap-1 text-sm text-primary">
          <span>Step {step} of 3</span>
          <div className="w-20 h-1.5 bg-primary/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${stepProgress[step]}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Step 1: Transaction Details */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-darkBg font-medium mb-2">
                Transaction Title
              </label>
              <GlassInput
                type="text"
                placeholder="E.g. Website Development Project"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-darkBg font-medium mb-2">
                Transaction Type
              </label>
              <select
                className="glass-input w-full px-4 py-3 focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY3VycmVudENvbG9yIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01Ljc5MiA3LjcwN2E1IDUgMCAwIDAgNy4wNyAwbC0uNzA3LS43MDdhNSA1IDAgMCAxLTcuMDcgMGwtLjcwNy43MDd6Ii8+PC9zdmc+')] bg-[length:20px_20px] bg-no-repeat bg-[right_10px_center]"
                value={formData.type}
                onChange={(e) => updateFormData("type", e.target.value)}
              >
                <option value="product">Product Purchase</option>
                <option value="service">Service Agreement</option>
                <option value="digital">Digital Goods</option>
                <option value="custom">Custom Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-darkBg font-medium mb-2">
              Description
            </label>
            <textarea
              className="glass-input w-full px-4 py-3 focus:outline-none min-h-[100px]"
              placeholder="Describe the transaction purpose and details..."
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-darkBg font-medium mb-2">
                Total Amount
              </label>
              <GlassInput
                type="text"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => updateFormData("amount", e.target.value)}
                icon={<span className="text-darkBg opacity-70">$</span>}
              />
            </div>
            <div>
              <label className="block text-darkBg font-medium mb-2">
                Currency
              </label>
              <select
                className="glass-input w-full px-4 py-3 focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iY3VycmVudENvbG9yIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01Ljc5MiA3LjcwN2E1IDUgMCAwIDAgNy4wNyAwbC0uNzA3LS43MDdhNSA1IDAgMCAxLTcuMDcgMGwtLjcwNy43MDd6Ii8+PC9zdmc+')] bg-[length:20px_20px] bg-no-repeat bg-[right_10px_center]"
                value={formData.currency}
                onChange={(e) => updateFormData("currency", e.target.value)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>
            <div>
              <label className="block text-darkBg font-medium mb-2">
                Expected Completion
              </label>
              <GlassInput
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateFormData("dueDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-darkBg font-medium mb-4">
              Participants
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-4 bg-opacity-40">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">You (Buyer)</p>
                    <p className="text-sm text-darkBg opacity-70">
                      {user?.username || "Your account"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 bg-opacity-40">
                <div className="flex justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Add Seller</p>
                    </div>
                  </div>
                </div>
                <GlassInput
                  type="email"
                  placeholder="Enter seller's email address"
                  className="text-sm"
                  value={formData.sellerEmail}
                  onChange={(e) => updateFormData("sellerEmail", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <GlassButton onClick={nextStep}>
              Continue to Milestones
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </GlassButton>
          </div>
        </div>
      )}

      {/* Step 2: Milestones */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-outfit font-semibold">Define Transaction Milestones</h4>
            <GlassButton variant="secondary" size="sm" onClick={addMilestone}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 inline-block mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Milestone
            </GlassButton>
          </div>

          <div className="space-y-4">
            {formData.milestones.length === 0 ? (
              <div className="text-center py-10 glass-card bg-opacity-30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-primary opacity-50 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-darkBg opacity-70">
                  No milestones yet. Add your first milestone to break down the project.
                </p>
              </div>
            ) : (
              formData.milestones.map((milestone, index) => (
                <div key={index} className="glass-card p-4 bg-opacity-40">
                  <div className="flex justify-between">
                    <h5 className="font-medium mb-2">Milestone {index + 1}</h5>
                    <button
                      className="text-destructive"
                      onClick={() => removeMilestone(index)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-darkBg text-sm mb-1">
                        Title
                      </label>
                      <GlassInput
                        type="text"
                        placeholder="E.g. Design Completion"
                        value={milestone.title}
                        onChange={(e) =>
                          updateMilestone(index, "title", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-darkBg text-sm mb-1">
                        Amount
                      </label>
                      <GlassInput
                        type="text"
                        placeholder="0.00"
                        value={milestone.amount}
                        onChange={(e) =>
                          updateMilestone(index, "amount", e.target.value)
                        }
                        icon={<span className="text-darkBg opacity-70">$</span>}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-darkBg text-sm mb-1">
                        Description
                      </label>
                      <textarea
                        className="glass-input w-full px-4 py-2 focus:outline-none min-h-[80px] text-sm"
                        placeholder="Describe what needs to be delivered..."
                        value={milestone.description}
                        onChange={(e) =>
                          updateMilestone(index, "description", e.target.value)
                        }
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-darkBg text-sm mb-1">
                        Due Date
                      </label>
                      <GlassInput
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) =>
                          updateMilestone(index, "dueDate", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 flex justify-between">
            <GlassButton variant="outline" onClick={prevStep}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </GlassButton>
            <GlassButton onClick={nextStep}>
              Review Transaction
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </GlassButton>
          </div>
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="glass-card p-4 bg-opacity-40">
            <h4 className="font-outfit font-semibold mb-4">Transaction Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-darkBg opacity-70 mb-1">Title</p>
                <p className="font-medium">{formData.title}</p>
              </div>
              <div>
                <p className="text-sm text-darkBg opacity-70 mb-1">Type</p>
                <p className="font-medium capitalize">{formData.type}</p>
              </div>
              <div>
                <p className="text-sm text-darkBg opacity-70 mb-1">Amount</p>
                <p className="font-medium">
                  {formData.currency} {formData.amount}
                </p>
              </div>
              <div>
                <p className="text-sm text-darkBg opacity-70 mb-1">
                  Expected Completion
                </p>
                <p className="font-medium">
                  {formData.dueDate
                    ? new Date(formData.dueDate).toLocaleDateString()
                    : "Not specified"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-darkBg opacity-70 mb-1">Description</p>
              <p>{formData.description}</p>
            </div>
          </div>

          <div className="glass-card p-4 bg-opacity-40">
            <h4 className="font-outfit font-semibold mb-4">Participants</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">You (Buyer)</p>
                  <p className="text-sm text-darkBg opacity-70">
                    {user?.username || "Your account"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Seller</p>
                  <p className="text-sm text-darkBg opacity-70">
                    {formData.sellerEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 bg-opacity-40">
            <h4 className="font-outfit font-semibold mb-4">Milestones</h4>
            <div className="space-y-3">
              {formData.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="glass-card p-3 bg-opacity-40 border-l-4 border-primary"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{milestone.title}</h5>
                      <p className="text-sm text-darkBg opacity-70">
                        {milestone.description}
                      </p>
                      <p className="text-xs text-darkBg opacity-60 mt-1">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formData.currency} {milestone.amount}
                      </p>
                      <p className="text-xs text-darkBg opacity-70">
                        {Math.round(
                          (parseFloat(milestone.amount) /
                            parseFloat(formData.amount)) *
                            100
                        )}
                        % of total
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 bg-opacity-40">
            <h4 className="font-outfit font-semibold mb-2">Terms & Conditions</h4>
            <div className="flex items-start gap-2 mb-4">
              <input
                type="checkbox"
                id="terms"
                className="mt-1"
                required
              />
              <label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <a href="#" className="text-primary">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary">
                  Privacy Policy
                </a>
                . I understand that once funded, the transaction will be governed
                by these terms.
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <GlassButton variant="outline" onClick={prevStep}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </GlassButton>
            <GlassButton onClick={handleSubmit}>
              Create Transaction
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
