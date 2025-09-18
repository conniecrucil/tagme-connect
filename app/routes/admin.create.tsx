import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import AdminContactBuilder from "~/components/AdminContactBuilder";

export default function AdminCreate() {

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Contact Creator</h1>
              <p className="text-gray-600 mt-2">
                Create contact cards without purchasing. All cards will be uploaded to S3 and admin will be notified.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/admin">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
        
        <AdminContactBuilder />
      </div>
    </div>
  );
}
