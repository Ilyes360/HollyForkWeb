import { Link } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide"),
})

type FormValues = z.infer<typeof formSchema>

export default function ForgotPasswordPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
        <CardDescription>
          Cette fonctionnalité sera bientôt disponible. Contactez votre
          administrateur pour réinitialiser votre mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Adresse email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-30"
                      />
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        className="pl-10"
                        placeholder="Adresse email"
                        disabled
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" className="w-full" disabled>
              Envoyer les instructions
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Vous vous souvenez ?{" "}
          <Link to="/login" className="text-foreground underline">
            Se connecter
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
