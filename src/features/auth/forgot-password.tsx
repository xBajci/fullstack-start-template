import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useAuthHelpers } from "@/features/auth/auth-hooks";
import { useTranslation } from "@/lib/intl/react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { forgotPassword } = useAuthHelpers();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    try {
      await forgotPassword.mutateAsync({ email: data.email });
      setIsSubmitted(true);
    } catch (err) {
      // Error handling is done via form validation
    }
  };

  if (isSubmitted) {
    return (
      <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>{t("CHECK_EMAIL")}</CardTitle>
            <CardDescription>{t("PASSWORD_RESET_LINK_SENT")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{t("CHECK_SPAM")}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setIsSubmitted(false)} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("BACK_TO_RESET")}
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{t("FORGOT_PASSWORD")}</CardTitle>
          <CardDescription>{t("FORGOT_PASSWORD_DESC")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="email">{t("EMAIL")}</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="email" placeholder={t("ENTER_EMAIL")} type="email" {...register("email")} />
                </InputGroup>
                <FieldError errors={errors.email} />
              </Field>
            </FieldSet>
            <ButtonGroup>
              <Button className="mt-4 w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? <Spinner size="sm" /> : t("SEND_RESET_LINK")}
              </Button>
            </ButtonGroup>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login">
            <Button className="px-0" variant="link">
              {t("BACK_TO_SIGN_IN")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
