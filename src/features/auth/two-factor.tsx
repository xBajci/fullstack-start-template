import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";
import { useTranslation } from "@/lib/intl/react";

const twoFactorSchema = z.object({
  totpCode: z
    .string()
    .length(6, "TOTP code must be exactly 6 digits")
    .regex(/^\d+$/, "TOTP code must contain only digits"),
});

export default function Component() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      totpCode: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: z.infer<typeof twoFactorSchema>) => {
    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: data.totpCode,
      });
      if (res.data?.token) {
        setSuccess(true);
      }
    } catch (error) {
      // Error handling is done via form validation
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{t("TOTP_VERIFICATION")}</CardTitle>
          <CardDescription>{t("ENTER_TOTP")}</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="font-semibold text-lg">{t("VERIFICATION_SUCCESSFUL")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldSet>
                <Field>
                  <FieldLabel htmlFor="totpCode">{t("TOTP_CODE")}</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="totpCode"
                      placeholder={t("ENTER_6_DIGIT_CODE")}
                      type="text"
                      {...register("totpCode")}
                    />
                  </InputGroup>
                  <FieldError errors={errors.totpCode} />
                </Field>
              </FieldSet>
              <ButtonGroup>
                <Button className="mt-4 w-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? <Spinner size="sm" /> : t("VERIFY")}
                </Button>
              </ButtonGroup>
            </form>
          )}
        </CardContent>
        <CardFooter className="gap-2 text-muted-foreground text-sm">
          <Link to="/two-factor/otp">
            <Button size="sm" variant="link">
              {t("SWITCH_EMAIL_VERIFICATION")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
