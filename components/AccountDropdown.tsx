"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountDropdown({
  onLogout,
  onClose,
}: {
  onLogout: () => void;
  onClose: () => void;
}) {
  const router = useRouter();

  const handleLogoutClick = () => {
    console.log(111)
    onLogout();
  };

  return (
    <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded shadow-lg z-50"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Link
        href="/settings"
        className="block px-4 py-2 hover:bg-gray-100"
        onClick={onClose}
      >
        Settings
      </Link>
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-100"
        onClick={handleLogoutClick}
      >
        Logout
      </button>
    </div>
  );
}
