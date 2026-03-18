interface AdminHeaderProps {
  title?: string
  description?: string
}

export function AdminHeader({
  title = "Administration",
  description = "Configurez vos établissements, équipes et accès.",
}: AdminHeaderProps) {
  return (
    <div>
      <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
