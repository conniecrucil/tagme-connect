import { useState, useEffect, useId } from "react";
import { useLoaderData } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useToast } from "~/components/ui/use-toast";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { Trash2, Plus } from "lucide-react";

export function meta() {
  return [
    { title: "Admin Users - Admin - TagMe Connections" },
    { name: "description", content: "Manage admin user access to the admin panel." },
  ];
}

export async function clientLoader(_args: ClientLoaderFunctionArgs) {
  try {
    const response = await fetch('/.netlify/functions/admin-users-list');
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin users');
    }

    const data = await response.json();
    return {
      users: data.users || [],
    };
  } catch (error) {
    console.error('Error fetching admin users:', error);
    throw error;
  }
}

export function handle() {
  return {
    breadcrumb: { label: "Admin Users" }
  };
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const { users: initialUsers } = useLoaderData<typeof clientLoader>();
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const emailInputId = useId();

  // Sync with loader data
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/.netlify/functions/admin-users-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add admin user');
      }

      toast({
        title: "Success",
        description: `Admin user ${newEmail} added successfully.`,
        variant: "default",
      });

      setNewEmail("");
      setIsSheetOpen(false);
      // Add the new user to the list
      const newUser: AdminUser = {
        id: data.user?.id || crypto.randomUUID(),
        email: newEmail.trim(),
        created_at: new Date().toISOString()
      };
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Error adding admin user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add admin user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to remove ${user.email} from the admin users list?`)) {
      return;
    }

    setDeletingId(user.id);
    try {
      const response = await fetch('/.netlify/functions/admin-users-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete admin user');
      }

      toast({
        title: "Success",
        description: `Admin user ${user.email} removed successfully.`,
        variant: "default",
      });

      // Remove the user from the list
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (error) {
      console.error('Error deleting admin user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete admin user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage who has access to the admin panel
          </p>
        </div>
        
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin User
            </Button>
          </SheetTrigger>
          <SheetContent className="px-6">
            <SheetHeader>
              <SheetTitle>Add New Admin User</SheetTitle>
              <SheetDescription>
                Enter the email address of the person you want to grant admin access to.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleAddUser} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={emailInputId}>Email Address</Label>
                <Input
                  id={emailInputId}
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Admin User'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsSheetOpen(false);
                    setNewEmail("");
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authorized Admin Users</CardTitle>
          <CardDescription>
            These email addresses can access the admin panel after signing in with Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No admin users found. Add your first admin user above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        disabled={deletingId === user.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
