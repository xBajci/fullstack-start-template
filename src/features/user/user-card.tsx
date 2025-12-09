import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Laptop, LogOut, PhoneIcon, QrCode, ShieldCheck, ShieldOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";
import * as z from "zod";
import CopyButton from "@/components/copy-button";
import { LanguageSwitch } from "@/components/language-switch";
import { AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AddPasskey } from "@/features/auth/add-passkey";
import { useAuthHelpers, useLogout } from "@/features/auth/auth-hooks";
import { ChangePassword } from "@/features/auth/change-password";
import { ChangeUser } from "@/features/auth/change-user";
import { ListPasskeys } from "@/features/auth/list-passkeys";
import type { AuthClient } from "@/lib/auth/auth-client";
import { authClient } from "@/lib/auth/auth-client";

// Validation schemas
const qrCodePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const twoFactorPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const twoFactorOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});

export default function UserCard(props: { activeSessions: AuthClient["$Infer"]["Session"]["session"][] }) {
  const { t } = useTranslation();
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const {
    getTotpUri,
    enableTwoFactor,
    disableTwoFactor,
    verifyTotpForEnable,
    sendVerificationEmail,
    signOut,
    revokeSession,
  } = useAuthHelpers();
  const [isTerminating, setIsTerminating] = useState<string>();
  const [twoFactorDialog, setTwoFactorDialog] = useState<boolean>(false);
  const [twoFactorVerifyURI, setTwoFactorVerifyURI] = useState<string>("");

  // Form for QR code password verification
  const qrCodeForm = useForm({
    resolver: zodResolver(qrCodePasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const {
    register: registerQrCode,
    handleSubmit: handleSubmitQrCode,
    formState: { errors: qrCodeErrors, isSubmitting: isSubmittingQrCode },
    reset: resetQrCode,
  } = qrCodeForm;

  const onSubmitQrCode = async (data: z.infer<typeof qrCodePasswordSchema>) => {
    getTotpUri.mutate(
      { password: data.password },
      {
        onSuccess: (data) => {
          setTwoFactorVerifyURI(data.data?.totpURI || "");
          resetQrCode();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  // Form for two-factor enable/disable
  const twoFactorForm = useForm({
    resolver: (data) => {
      if (twoFactorVerifyURI) {
        // When showing OTP input
        return zodResolver(twoFactorOtpSchema)(data);
      }
      // When showing password input
      return zodResolver(twoFactorPasswordSchema)(data);
    },
    defaultValues: {
      password: "",
      otp: "",
    },
  });

  const {
    register: registerTwoFactor,
    handleSubmit: handleSubmitTwoFactor,
    formState: { errors: twoFactorErrors, isSubmitting: isSubmittingTwoFactor },
    setValue,
    reset: resetTwoFactor,
    watch,
  } = twoFactorForm;
  const watchOtp = watch("otp");
  const watchPassword = watch("password");

  const onSubmitTwoFactor = async (data: any) => {
    if (session?.user.twoFactorEnabled) {
      // Disable 2FA
      disableTwoFactor.mutate(
        { password: data.password },
        {
          onSuccess: () => {
            toast("2FA disabled successfully");
            setTwoFactorDialog(false);
            resetTwoFactor();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }
      );
    } else if (twoFactorVerifyURI) {
      // Verify OTP to enable 2FA
      verifyTotpForEnable.mutate(
        { code: data.otp },
        {
          onSuccess: () => {
            toast("2FA enabled successfully");
            setTwoFactorVerifyURI("");
            resetTwoFactor();
            setTwoFactorDialog(false);
          },
          onError: (error) => {
            setValue("otp", "");
            toast.error(error.message);
          },
        }
      );
    } else {
      // Enable 2FA - get TOTP URI
      enableTwoFactor.mutate(
        { password: data.password },
        {
          onSuccess: (data) => {
            setTwoFactorVerifyURI(data.data?.totpURI || "");
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }
      );
    }
  };

  const handleSendVerificationEmail = async () => {
    sendVerificationEmail.mutate(
      {
        email: session?.user.email || "",
      },
      {
        onError(error) {
          toast.error(error.message);
        },
        onSuccess() {
          toast.success("Verification email sent successfully");
        },
      }
    );
  };

  const handleRevokeSession = async (item: AuthClient["$Infer"]["Session"]["session"]) => {
    setIsTerminating(item.id);
    const res = await revokeSession.mutateAsync({
      token: item.token,
    });

    if (res.error) {
      toast.error(res.error.message);
    } else {
      toast.success("Session terminated successfully");
    }
    if (item.id === session?.session?.id) {
      signOut.mutate(undefined, {
        onSuccess() {
          setIsTerminating(undefined);
          navigate({ to: "/" });
        },
      });
    }
    setIsTerminating(undefined);
  };
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("USER")}</CardTitle>
        <LanguageSwitch />
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="hidden h-9 w-9 sm:flex">
              <AvatarImage alt="Avatar" className="object-cover" src={session?.user.image || "#"} />
              <AvatarFallback>{session?.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="font-medium text-sm leading-none">{session?.user.name}</p>
              <p className="text-sm">{session?.user.email}</p>
            </div>
          </div>
          <ChangeUser />
        </div>

        {session?.user.emailVerified ? null : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <AlertTitle>{t("VERIFY_EMAIL")}</AlertTitle>
              <AlertDescription className="text-muted-foreground">{t("VERIFY_EMAIL_DESC")}</AlertDescription>
              <Button className="mt-2" onClick={handleSendVerificationEmail} size="sm" variant="secondary">
                {sendVerificationEmail.isPending ? <Spinner size="sm" /> : t("RESEND_VERIFICATION")}
              </Button>
            </div>
          </div>
        )}

        <div className="flex w-max flex-col gap-1 border-l-2 px-2">
          <p className="font-medium text-xs">{t("ACTIVE_SESSIONS")}</p>
          {props?.activeSessions
            ?.filter((item) => item.userAgent)
            .map((item) => (
              <div key={item.id}>
                <div className="flex items-center gap-2 font-medium text-black text-sm dark:text-white">
                  {new UAParser(item.userAgent || "").getDevice().type === "mobile" ? (
                    <PhoneIcon />
                  ) : (
                    <Laptop size={16} />
                  )}
                  {new UAParser(item.userAgent || "").getOS().name},{" "}
                  {new UAParser(item.userAgent || "").getBrowser().name}
                  <Button
                    className="min-w-[100px] cursor-pointer"
                    onClick={() => handleRevokeSession(item)}
                    variant="outline"
                  >
                    {isTerminating === item.id ? (
                      <Spinner size="sm" />
                    ) : item.id === session?.session?.id ? (
                      t("SIGN_OUT")
                    ) : (
                      t("TERMINATE")
                    )}
                  </Button>
                </div>
              </div>
            ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-y py-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm">{t("PASSKEYS")}</p>
            <div className="flex flex-wrap gap-2">
              <AddPasskey />
              <ListPasskeys />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm">{t("TWO_FACTOR")}</p>
            <div className="flex gap-2">
              {!!session?.user.twoFactorEnabled && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2" variant="outline">
                      <QrCode size={16} />
                      <span className="text-xs md:text-sm">{t("SCAN_QR_CODE")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-11/12 sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("SCAN_QR_CODE")}</DialogTitle>
                      <DialogDescription>{t("SCAN_QR_DESC")}</DialogDescription>
                    </DialogHeader>

                    {twoFactorVerifyURI ? (
                      <>
                        <div className="flex items-center justify-center">
                          <QRCode value={twoFactorVerifyURI} />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-muted-foreground text-sm">{t("COPY_URI")}</p>
                          <CopyButton textToCopy={twoFactorVerifyURI} />
                        </div>
                      </>
                    ) : (
                      <form onSubmit={handleSubmitQrCode(onSubmitQrCode)}>
                        <FieldSet>
                          <FieldGroup>
                            <Field>
                              <FieldLabel htmlFor="qr-password">{t("ENTER_PASSWORD")}</FieldLabel>
                              <InputGroup>
                                <InputGroupInput
                                  id="qr-password"
                                  placeholder={t("ENTER_PASSWORD")}
                                  type="password"
                                  {...registerQrCode("password")}
                                />
                              </InputGroup>
                              <FieldError errors={qrCodeErrors.password} />
                            </Field>
                          </FieldGroup>
                        </FieldSet>
                        <ButtonGroup>
                          <Button disabled={isSubmittingQrCode || getTotpUri.isPending} type="submit">
                            {isSubmittingQrCode || getTotpUri.isPending ? <Spinner size="sm" /> : t("SHOW_QR_CODE")}
                          </Button>
                        </ButtonGroup>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              )}
              <Dialog onOpenChange={setTwoFactorDialog} open={twoFactorDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2" variant={session?.user.twoFactorEnabled ? "destructive" : "outline"}>
                    {session?.user.twoFactorEnabled ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                    <span className="text-xs md:text-sm">
                      {session?.user.twoFactorEnabled ? t("DISABLE_2FA") : t("ENABLE_2FA")}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-11/12 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{session?.user.twoFactorEnabled ? t("DISABLE_2FA") : t("ENABLE_2FA")}</DialogTitle>
                    <DialogDescription>
                      {session?.user.twoFactorEnabled ? t("DISABLE_2FA_DESC") : t("ENABLE_2FA_DESC")}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmitTwoFactor(onSubmitTwoFactor)}>
                    <FieldSet>
                      <FieldGroup>
                        {twoFactorVerifyURI ? (
                          <>
                            <div className="flex items-center justify-center">
                              <QRCode value={twoFactorVerifyURI} />
                            </div>
                            <FieldDescription>{t("SCAN_QR_DESC")}</FieldDescription>
                            <Field>
                              <FieldLabel htmlFor="otp">{t("ENTER_OTP")}</FieldLabel>
                              <InputGroup>
                                <InputGroupInput id="otp" placeholder={t("ENTER_OTP")} {...registerTwoFactor("otp")} />
                              </InputGroup>
                              <FieldError errors={twoFactorErrors.otp} />
                            </Field>
                          </>
                        ) : (
                          <Field>
                            <FieldLabel htmlFor="two-factor-password">{t("PASSWORD")}</FieldLabel>
                            <InputGroup>
                              <InputGroupInput
                                id="two-factor-password"
                                placeholder={t("PASSWORD")}
                                type="password"
                                {...registerTwoFactor("password")}
                              />
                            </InputGroup>
                            <FieldError errors={twoFactorErrors.password} />
                          </Field>
                        )}
                      </FieldGroup>
                    </FieldSet>
                    <DialogFooter>
                      <ButtonGroup>
                        <Button
                          disabled={
                            isSubmittingTwoFactor ||
                            disableTwoFactor.isPending ||
                            enableTwoFactor.isPending ||
                            verifyTotpForEnable.isPending
                          }
                          type="submit"
                        >
                          {isSubmittingTwoFactor ||
                          disableTwoFactor.isPending ||
                          enableTwoFactor.isPending ||
                          verifyTotpForEnable.isPending ? (
                            <Spinner size="sm" />
                          ) : session?.user.twoFactorEnabled ? (
                            t("DISABLE_2FA")
                          ) : (
                            t("ENABLE_2FA")
                          )}
                        </Button>
                      </ButtonGroup>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="items-center justify-between gap-2">
        <ChangePassword />
        <Button
          className="z-10 gap-2"
          disabled={logout.isPending}
          onClick={async () => {
            // setIsSignOut(true);
            // await authClient.signOut({
            //   fetchOptions: {
            //     onSuccess() {
            //       navigate({ to: "/" });
            //     },
            //   },
            // });
            // setIsSignOut(false);
            logout.mutate();
          }}
          variant="secondary"
        >
          <span className="text-sm">
            {logout.isPending ? (
              <Spinner size="sm" />
            ) : (
              <div className="flex items-center gap-2">
                <LogOut size={16} />
                {t("SIGN_OUT")}
              </div>
            )}
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}
