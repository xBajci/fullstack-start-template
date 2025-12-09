import { zodResolver } from "@hookform/resolvers/zod";
import { Fingerprint, Plus } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";

const addPasskeySchema = z.object({
  passkeyName: z.string().min(1, "Passkey name is required"),
});

export function AddPasskey() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(addPasskeySchema),
    defaultValues: {
      passkeyName: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const onSubmit = async (data: z.infer<typeof addPasskeySchema>) => {
    try {
      const res = await authClient.passkey.addPasskey({
        name: data.passkeyName,
      });
      if (res?.error) {
        toast.error(res?.error.message);
      } else {
        setIsOpen(false);
        reset();
        toast.success("Passkey added successfully. You can now use it to login.");
      }
    } catch (error) {
      toast.error("An error occurred while adding passkey");
    }
  };
  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 text-xs md:text-sm" variant="outline">
          <Plus size={15} />
          {t("ADD_NEW_PASSKEY")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-11/12 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("ADD_NEW_PASSKEY")}</DialogTitle>
          <DialogDescription>{t("ADD_PASSKEY_DESC")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldSet>
            <Field>
              <FieldLabel htmlFor="passkeyName">{t("PASSKEY_NAME")}</FieldLabel>
              <InputGroup>
                <InputGroupInput id="passkeyName" type="text" {...register("passkeyName")} />
              </InputGroup>
              <FieldError errors={errors.passkeyName} />
            </Field>
          </FieldSet>
        </form>
        <DialogFooter>
          <ButtonGroup>
            <Button className="w-full" disabled={isSubmitting} onClick={handleSubmit(onSubmit)} type="submit">
              {isSubmitting ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  {t("CREATE_PASSKEY")}
                </>
              )}
            </Button>
          </ButtonGroup>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
