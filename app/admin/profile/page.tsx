import { ProfileView } from "@/components/profile/ProfileView";

export const metadata = {
  title: "Account Profile - Admin - Palakaluru RMS",
};

export default function AdminProfilePage() {
  return <ProfileView role="admin" />;
}
