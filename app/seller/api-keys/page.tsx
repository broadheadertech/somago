// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";

const AVAILABLE_PERMISSIONS = [
  { id: "products:read", label: "Read Products" },
  { id: "products:write", label: "Write Products" },
  { id: "orders:read", label: "Read Orders" },
  { id: "inventory:read", label: "Read Inventory" },
  { id: "inventory:write", label: "Write Inventory" },
  { id: "analytics:read", label: "Read Analytics" },
];

export default function ApiKeysPage() {
  const keys = useQuery(api.apiKeys.listMyKeys);
  const generateKey = useMutation(api.apiKeys.generateKey);
  const revokeKey = useMutation(api.apiKeys.revokeKey);

  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!keyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }
    if (selectedPerms.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    setLoading(true);
    try {
      const result = await generateKey({ name: keyName.trim(), permissions: selectedPerms });
      setGeneratedKey(result.key);
      setKeyName("");
      setSelectedPerms([]);
      toast.success("API key created!");
    } catch (e: any) {
      toast.error(e.message || "Failed to create key");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await revokeKey({ keyId: keyId as any });
      toast.success("API key revoked");
    } catch (e: any) {
      toast.error(e.message || "Failed to revoke key");
    }
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">API Keys</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage API keys for third-party integrations with your store.
          </p>
        </div>
        <Button
          className="bg-primary-600 hover:bg-primary-700"
          onClick={() => { setShowCreate(!showCreate); setGeneratedKey(null); }}
        >
          {showCreate ? "Cancel" : "+ Create Key"}
        </Button>
      </div>

      {/* Generated Key Alert */}
      {generatedKey && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4">
            <p className="mb-2 text-sm font-medium text-yellow-800">
              Copy your API key now — it won't be shown again!
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono text-neutral-900 border border-yellow-200">
                {generatedKey}
              </code>
              <Button size="sm" onClick={copyKey} className="bg-yellow-600 hover:bg-yellow-700">
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreate && !generatedKey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Key Name</label>
              <Input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., Inventory Sync, Order Webhook"
                maxLength={100}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">Permissions</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 rounded border border-border px-3 py-2 cursor-pointer hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(perm.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPerms([...selectedPerms, perm.id]);
                        } else {
                          setSelectedPerms(selectedPerms.filter((p) => p !== perm.id));
                        }
                      }}
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-neutral-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-primary-600 hover:bg-primary-700"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate API Key"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Keys */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Your API Keys</h2>
        {keys === undefined ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : keys.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            No API keys yet. Create one to integrate with external services.
          </p>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key._id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">{key.name}</span>
                    <Badge
                      variant={key.isActive ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {key.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                    <code className="font-mono">{key.keyPrefix}••••••••</code>
                    <span>Permissions: {key.permissions.length}</span>
                    <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                    {key.lastUsedAt && (
                      <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {key.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleRevoke(key._id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Documentation Link */}
      <Card className="bg-neutral-50">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-neutral-900">API Documentation</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Use your API key in the <code className="font-mono text-primary-600">Authorization</code> header:
          </p>
          <pre className="mt-2 rounded bg-neutral-900 p-3 text-xs text-green-400 overflow-x-auto">
{`curl -H "Authorization: Bearer sk_your_api_key" \\
  https://somago.com/api/v1/products`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
