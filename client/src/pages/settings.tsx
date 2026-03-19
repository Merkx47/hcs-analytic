import { MdCancel, MdCheckCircle, MdLock, MdNotifications, MdPeople, MdPerson, MdPublic, MdRefresh, MdSave, MdSettings as MdSettingsIcon, MdShield, MdSync, MdTranslate, MdVpnKey } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinOpsStore } from '@/lib/finops-store';
import { useDataStore, defaultExchangeRates } from '@/lib/data-store';
import type { Language, ExchangeRates } from '@/lib/data-store';
import type { Currency } from '@shared/schema';
import { currencyInfo } from '@shared/schema';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { UserOnboarding } from '@/components/admin/user-onboarding';
import { NotificationSettings } from '@/components/admin/notification-settings';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const { currency, setCurrency } = useFinOpsStore();
  const {
    settings,
    updateProfile,
    updateTimezone,
    updateNotifications,
    connectApi,
    disconnectApi,
    updateSecurity,
    changePassword,
    updateLanguage,
    updateExchangeRates,
    resetExchangeRates,
  } = useDataStore();

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: settings.profile.firstName,
    lastName: settings.profile.lastName,
    email: settings.profile.email,
  });

  const [editableRates, setEditableRates] = useState<ExchangeRates>({ ...settings.exchangeRates });

  const [apiForm, setApiForm] = useState({
    accessKey: settings.apiCredentials.accessKey,
    secretKey: settings.apiCredentials.secretKey,
  });

  const [newPassword, setNewPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveProfile = () => {
    updateProfile(profileForm);
  };

  const handleConnectApi = async () => {
    if (!apiForm.accessKey || !apiForm.secretKey) return;
    setIsConnecting(true);
    await connectApi(apiForm);
    setIsConnecting(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    setIsChangingPassword(true);
    await changePassword(newPassword);
    setNewPassword('');
    setIsChangingPassword(false);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="settings-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MdSettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Configure your profile, preferences, users, and API connections</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdPerson className="h-5 w-5 text-primary" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        placeholder="Chidi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        placeholder="Okonkwo"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="chidi@company.com"
                    />
                  </div>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdPublic className="h-5 w-5 text-primary" />
                    Display Preferences
                  </CardTitle>
                  <CardDescription>Customize your dashboard experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                        <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={settings.timezone} onValueChange={updateTimezone}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="africa-lagos">Africa/Lagos (WAT)</SelectItem>
                        <SelectItem value="africa-johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                        <SelectItem value="africa-nairobi">Africa/Nairobi (EAT)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Display Language</Label>
                    <Select value={settings.language} onValueChange={(value) => {
                      updateLanguage(value as Language);
                      if (value !== 'en') {
                        toast({
                          title: 'Language Updated',
                          description: 'Translation powered by Google Translate',
                        });
                      }
                    }}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MdTranslate className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Powered by Google Translate</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdRefresh className="h-5 w-5 text-primary" />
                    Exchange Rates
                  </CardTitle>
                  <CardDescription>Set how much 1 NGN is worth in each foreign currency. All HCS costs are in Naira — other currencies are converted using these rates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Object.keys(currencyInfo) as Currency[]).map((code) => {
                      const info = currencyInfo[code];
                      const isBase = code === 'NGN';
                      return (
                        <div
                          key={code}
                          className="flex items-center gap-3 p-3 rounded-lg border border-card-border bg-card/30"
                        >
                          <span className="text-xl">{info.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-foreground">{code}</span>
                              {isBase && (
                                <>
                                  <MdLock className="h-3 w-3 text-muted-foreground" />
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Base Currency</Badge>
                                </>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{info.name}</span>
                          </div>
                          <Input
                            type="number"
                            step="any"
                            className="w-[120px] text-right"
                            value={isBase ? '1' : editableRates[code]}
                            disabled={isBase}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                setEditableRates((prev) => ({ ...prev, [code]: val }));
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => updateExchangeRates(editableRates)}>
                      <MdSave className="h-4 w-4 mr-2" />
                      Save Rates
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetExchangeRates();
                        setEditableRates({ ...defaultExchangeRates });
                      }}
                    >
                      <MdRefresh className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <UserOnboarding />
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <NotificationSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdVpnKey className="h-5 w-5 text-primary" />
                    Huawei Cloud API Credentials
                  </CardTitle>
                  <CardDescription>Connect to Huawei Cloud for live data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.apiCredentials.isConnected && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <MdCheckCircle className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">Connected to Huawei Cloud</span>
                      <Badge variant="secondary" className="ml-auto bg-emerald-500/10 text-emerald-500">Active</Badge>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="accessKey">Access Key (AK)</Label>
                    <Input
                      id="accessKey"
                      type="password"
                      value={apiForm.accessKey}
                      onChange={(e) => setApiForm({ ...apiForm, accessKey: e.target.value })}
                      placeholder="Enter your access key"
                      disabled={settings.apiCredentials.isConnected}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretKey">Secret Key (SK)</Label>
                    <Input
                      id="secretKey"
                      type="password"
                      value={apiForm.secretKey}
                      onChange={(e) => setApiForm({ ...apiForm, secretKey: e.target.value })}
                      placeholder="Enter your secret key"
                      disabled={settings.apiCredentials.isConnected}
                    />
                  </div>
                  {settings.apiCredentials.isConnected ? (
                    <Button variant="destructive" onClick={disconnectApi}>
                      <MdCancel className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnectApi}
                      disabled={isConnecting || !apiForm.accessKey || !apiForm.secretKey}
                    >
                      {isConnecting ? (
                        <>
                          <MdSync className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect to Huawei Cloud'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MdShield className="h-5 w-5 text-primary" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorEnabled}
                      onCheckedChange={(checked) => updateSecurity({ twoFactorEnabled: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Change Password</Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="New password (min 8 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword || !newPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <MdSync className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
