import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { Edit, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/features/auth/auth-hooks";
import { authClient } from "@/lib/auth/auth-client";
import { convertImageToBase64 } from "@/lib/utils";

const changeUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  image: z.instanceof(File).optional(),
});

export function ChangeUser() {
  const { t } = useTranslation();
  const { data } = useSession();
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const form = useForm({
    resolver: zodResolver(changeUserSchema),
    defaultValues: {
      name: "",
      image: undefined as File | undefined,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = form;

  const onSubmit = async (data: z.infer<typeof changeUserSchema>) => {
    try {
      await authClient.updateUser({
        image: data.image ? await convertImageToBase64(data.image) : undefined,
        name: data.name ? data.name : undefined,
        fetchOptions: {
          onSuccess: () => {
            toast.success("User updated successfully");
          },
          onError: (error) => {
            toast.error(error.error.message);
          },
        },
      });
      reset();
      router.invalidate();
      setImagePreview(null);
      setOpen(false);
    } catch (error) {
      toast.error("An error occurred while updating user");
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
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="gap-2" size="sm" variant="secondary">
          <Edit size={13} />
          {t("EDIT_USER")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-11/12 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("EDIT_USER")}</DialogTitle>
          <DialogDescription>{t("EDIT_USER_DESC")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldSet>
            <Field>
              <FieldLabel htmlFor="name">{t("FULL_NAME")}</FieldLabel>
              <InputGroup>
                <InputGroupInput id="name" placeholder={data?.user.name} type="text" {...register("name")} />
              </InputGroup>
              <FieldError errors={errors.name} />
            </Field>

            <Field>
              <FieldLabel>{t("PROFILE_IMAGE")}</FieldLabel>
              <FieldContent>
                {imagePreview && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-sm">
                    <img alt="Profile preview" className="h-full w-full object-cover" src={imagePreview} />
                  </div>
                )}
                <div className="flex w-full items-center gap-2">
                  <Input
                    accept="image/*"
                    className="w-full text-muted-foreground"
                    id="image"
                    onChange={handleImageChange}
                    type="file"
                  />
                  {imagePreview && <X className="cursor-pointer" onClick={clearImage} />}
                </div>
              </FieldContent>
            </Field>
          </FieldSet>
        </form>
        <DialogFooter>
          <ButtonGroup>
            <Button disabled={isSubmitting} onClick={handleSubmit(onSubmit)} type="submit">
              {isSubmitting ? <Spinner size="sm" /> : t("UPDATE")}
            </Button>
          </ButtonGroup>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
