import React from "react";
import { Redirect } from "wouter";

export default function AdminDashboard() {
  // Simply redirect to the main admin page
  return <Redirect to="/admin" />;
} 