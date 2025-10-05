import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useAuthHelpers } from "@/features/auth/auth-hooks";
import { useTranslation } from "@/lib/intl/react";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});

export default function Component() {
  const { t } = useTranslation();
  const { sendOtp, verifyOtp } = useAuthHelpers();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const router = useRouter();

  // In a real app, this email would come from your authentication context
  const userEmail = "user@example.com";

  const form = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: z.infer<typeof otpSchema>) => {
    try {
      const res = await verifyOtp.mutateAsync({
        code: data.otp,
      });
      if (res.data) {
        setMessage(t("OTP_VALIDATED"));
        setIsError(false);
        setIsValidated(true);
        router.navigate({ to: "/" });
      } else {
        setIsError(true);
        setMessage(t("INVALID_OTP"));
      }
    } catch (error) {
      setIsError(true);
      setMessage(t("INVALID_OTP"));
    }
  };

  const requestOTP = async () => {
    await sendOtp.mutateAsync();
    setMessage(t("OTP_SENT"));
    setIsError(false);
    setIsOtpSent(true);
  };
  return (
    <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{t("TWO_FACTOR_AUTH")}</CardTitle>
          <CardDescription>{t("VERIFY_IDENTITY")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            {isOtpSent ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <FieldSet>
                  <Field>
                    <FieldLabel htmlFor="otp">{t("ONE_TIME_PASSWORD")}</FieldLabel>
                    <FieldContent>
                      <p className="py-2 text-muted-foreground text-sm">
                        {t("CHECK_EMAIL_OTP")} {userEmail}
                      </p>
                      <InputGroup>
                        <InputGroupInput id="otp" placeholder={t("ENTER_6_DIGIT")} type="text" {...register("otp")} />
                      </InputGroup>
                    </FieldContent>
                    <FieldError errors={errors.otp} />
                  </Field>
                </FieldSet>
                <ButtonGroup>
                  <Button className="mt-4 w-full" disabled={isSubmitting || isValidated} type="submit">
                    {isSubmitting ? <Spinner size="sm" /> : t("VALIDATE_OTP")}
                  </Button>
                </ButtonGroup>
              </form>
            ) : (
              <Button className="w-full" onClick={requestOTP}>
                <Mail className="mr-2 h-4 w-4" /> {t("SEND_OTP_EMAIL")}
              </Button>
            )}
          </div>
          {message && (
            <div className={`mt-4 flex items-center gap-2 ${isError ? "text-red-500" : "text-primary"}`}>
              {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <p className="text-sm">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
