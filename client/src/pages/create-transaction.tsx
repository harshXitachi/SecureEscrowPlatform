import { Helmet } from "react-helmet";
import TransactionForm from "@/components/transactions/transaction-form";
import { motion } from "framer-motion";

export default function CreateTransaction() {
  return (
    <>
      <Helmet>
        <title>Create Transaction | Middlesman</title>
      </Helmet>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-outfit font-bold text-darkBg mb-4">
            Create a New Transaction
          </h1>
          <p className="text-lg text-darkBg opacity-80 max-w-2xl mx-auto">
            Set up a secure escrow transaction with customizable milestones and payment terms.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TransactionForm />
        </motion.div>
      </div>
    </>
  );
}
