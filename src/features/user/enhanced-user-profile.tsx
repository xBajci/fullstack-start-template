import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Calendar, Camera, Github, Link as LinkIcon, MapPin, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth/auth-client";

// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  github: z.string().max(50, "GitHub username must be less than 50 characters").optional(),
  twitter: z.string().max(50, "Twitter handle must be less than 50 characters").optional(),
});

export function EnhancedUserProfile() {
  const { data: session } = authClient.useSession();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      bio: "",
      location: "",
      website: "",
      github: "",
      twitter: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = form;
  const watchAll = watch();

  // Reset form when session changes
  useEffect(() => {
    if (session?.user) {
      reset({
        name: session.user.name || "",
        email: session.user.email || "",
        bio: "",
        location: "",
        website: "",
        github: "",
        twitter: "",
      });
    }
  }, [session?.user, reset]);

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      // TODO: Implement profile update with Better-auth
      console.log("Saving profile:", data);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-start gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage alt={session?.user?.name} src={session?.user?.image} />
            <AvatarFallback className="text-lg">
              {session?.user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <Button className="-bottom-2 -right-2 absolute h-8 w-8 rounded-full p-0" size="sm" variant="outline">
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-2xl">{watchAll.name || session?.user?.name}</h3>
            {session?.user?.emailVerified && (
              <Badge className="border-blue-200 text-blue-600" variant="outline">
                <BadgeCheck className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{watchAll.email || session?.user?.email}</p>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            {watchAll.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {watchAll.location}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Member since{" "}
              {session?.user?.createdAt ? new Date(session.user.createdAt).getFullYear() : new Date().getFullYear()}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <ButtonGroup>
              <Button disabled={isSubmitting} onClick={handleSubmit(onSubmit)} size="sm">
                {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline">
                Cancel
              </Button>
            </ButtonGroup>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Profile Fields */}
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldSet>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="name">Display Name</FieldLabel>
                  <InputGroup>
                    <InputGroupInput id="name" {...register("name")} />
                  </InputGroup>
                  <FieldError errors={errors.name} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <InputGroup>
                    <InputGroupInput id="email" type="email" {...register("email")} />
                  </InputGroup>
                  <FieldError errors={errors.email} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="bio">Bio</FieldLabel>
                <FieldContent>
                  <Textarea
                    className="min-h-[100px]"
                    id="bio"
                    placeholder="Tell us a little bit about yourself"
                    {...register("bio")}
                  />
                </FieldContent>
                <FieldError errors={errors.bio} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="location">Location</FieldLabel>
                  <InputGroup>
                    <InputGroupInput id="location" {...register("location")} />
                  </InputGroup>
                  <FieldError errors={errors.location} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="website"
                      placeholder="https://example.com"
                      type="url"
                      {...register("website")}
                    />
                  </InputGroup>
                  <FieldError errors={errors.website} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="github">GitHub Username</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Github className="h-4 w-4" />
                    </InputGroupAddon>
                    <InputGroupInput id="github" placeholder="username" {...register("github")} />
                  </InputGroup>
                  <FieldError errors={errors.github} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="twitter">Twitter Handle</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Twitter className="h-4 w-4" />
                    </InputGroupAddon>
                    <InputGroupInput id="twitter" placeholder="@username" {...register("twitter")} />
                  </InputGroup>
                  <FieldError errors={errors.twitter} />
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
        </form>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground text-sm">Display Name</Label>
                <p className="text-sm">{watchAll.name || session?.user?.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground text-sm">Email</Label>
                <p className="text-sm">{watchAll.email || session?.user?.email}</p>
              </div>
            </div>

            {watchAll.bio && (
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground text-sm">Bio</Label>
                <p className="text-sm">{watchAll.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {watchAll.location && (
                <div className="space-y-2">
                  <Label className="font-medium text-muted-foreground text-sm">Location</Label>
                  <p className="text-sm">{watchAll.location}</p>
                </div>
              )}
              {watchAll.website && (
                <div className="space-y-2">
                  <Label className="font-medium text-muted-foreground text-sm">Website</Label>
                  <p className="text-sm">{watchAll.website}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {watchAll.github && (
                <div className="space-y-2">
                  <Label className="font-medium text-muted-foreground text-sm">GitHub</Label>
                  <p className="text-sm">@{watchAll.github}</p>
                </div>
              )}
              {watchAll.twitter && (
                <div className="space-y-2">
                  <Label className="font-medium text-muted-foreground text-sm">Twitter</Label>
                  <p className="text-sm">{watchAll.twitter}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Profile Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">12</div>
            <p className="text-muted-foreground text-xs">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">3</div>
            <p className="text-muted-foreground text-xs">Active memberships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">1,247</div>
            <p className="text-muted-foreground text-xs">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Social Links */}
      {!isEditing && (watchAll.website || watchAll.github || watchAll.twitter) && (
        <div className="space-y-3">
          <Label className="font-medium text-sm">Links</Label>
          <div className="flex gap-4">
            {watchAll.website && (
              <Button asChild size="sm" variant="outline">
                <a href={watchAll.website} rel="noopener noreferrer" target="_blank">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Website
                </a>
              </Button>
            )}
            {watchAll.github && (
              <Button asChild size="sm" variant="outline">
                <a href={`https://github.com/${watchAll.github}`} rel="noopener noreferrer" target="_blank">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
            )}
            {watchAll.twitter && (
              <Button asChild size="sm" variant="outline">
                <a
                  href={`https://twitter.com/${watchAll.twitter.replace("@", "")}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Twitter className="mr-2 h-4 w-4" />
                  Twitter
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
