import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { authClient } from "@/lib/auth/auth-client";
import { useTranslation } from "@/lib/intl/react";
import { convertImageToBase64 } from "@/lib/utils";

const signUpSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z.string(),
    image: z.instanceof(File).optional(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "The two passwords do not match.",
    path: ["passwordConfirmation"],
  });

export function SignUpForm() {
  const { t } = useTranslation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      image: undefined as File | undefined,
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, reset } = form;

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    try {
      await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
        image: data.image ? await convertImageToBase64(data.image) : "",
        callbackURL: "/dashboard",
        fetchOptions: {
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
          onSuccess: async () => {
            navigate({ to: "/dashboard" });
          },
        },
      });
    } catch (error) {
      toast.error("An error occurred during sign up");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setValue("image", undefined);
    setImagePreview(null);
  };

  return (
    <Card className="z-50 max-w-md rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">{t("SIGN_UP")}</CardTitle>
        <CardDescription className="text-xs md:text-sm">{t("SIGN_UP_DESC")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldSet>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">{t("FIRST_NAME")}</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="firstName"
                      placeholder="Max"
                      {...register("firstName")}
                    />
                  </InputGroup>
                  <FieldError errors={errors.firstName} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="lastName">{t("LAST_NAME")}</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="lastName"
                      placeholder="Robinson"
                      {...register("lastName")}
                    />
                  </InputGroup>
                  <FieldError errors={errors.lastName} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">{t("EMAIL")}</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    {...register("email")}
                  />
                </InputGroup>
                <FieldError errors={errors.email} />
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">{t("PASSWORD")}</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type="password"
                    placeholder={t("PASSWORD")}
                    {...register("password")}
                  />
                </InputGroup>
                <FieldError errors={errors.password} />
              </Field>

              <Field>
                <FieldLabel htmlFor="passwordConfirmation">{t("CONFIRM_PASSWORD")}</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="passwordConfirmation"
                    type="password"
                    placeholder={t("CONFIRM_PASSWORD")}
                    {...register("passwordConfirmation")}
                  />
                </InputGroup>
                <FieldError errors={errors.passwordConfirmation} />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field>
            <FieldLabel>{t("PROFILE_IMAGE")}</FieldLabel>
            <FieldContent>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="h-16 w-16 rounded object-cover"
                    width={16}
                    height={16}
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-destructive text-sm hover:text-destructive/80"
                  >
                    Remove
                  </button>
                </div>
              )}
            </FieldContent>
          </Field>

          <ButtonGroup>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : t("CREATE_ACCOUNT")}
            </Button>
          </ButtonGroup>
        </form>
      </CardContent>
      <CardFooter>
        <div className="flex w-full justify-center border-t py-4">
          <p className="text-center text-neutral-500 text-xs">
            {t("SECURED_BY")} <span className="text-orange-400">better-auth.</span>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
