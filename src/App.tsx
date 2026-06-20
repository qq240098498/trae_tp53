import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ClothesReceive from "@/pages/ClothesReceive";
import OrderList from "@/pages/OrderList";
import OrderDetail from "@/pages/OrderDetail";
import PickupVerify from "@/pages/PickupVerify";
import MemberList from "@/pages/MemberList";
import MemberDetail from "@/pages/MemberDetail";
import MemberRecharge from "@/pages/MemberRecharge";
import PricingConfig from "@/pages/PricingConfig";
import Statistics from "@/pages/Statistics";
import PickupPointManagement from "@/pages/PickupPointManagement";
import BatchManagement from "@/pages/BatchManagement";
import BatchDetail from "@/pages/BatchDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/receive" element={<ClothesReceive />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/pickup" element={<PickupVerify />} />
          <Route path="/members" element={<MemberList />} />
          <Route path="/members/recharge" element={<MemberRecharge />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/pickup-points" element={<PickupPointManagement />} />
          <Route path="/batches" element={<BatchManagement />} />
          <Route path="/batches/:id" element={<BatchDetail />} />
          <Route path="/pricing" element={<PricingConfig />} />
          <Route path="/statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  );
}
