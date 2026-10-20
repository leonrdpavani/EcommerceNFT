import { useNavigate } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const navigate = useNavigate()
  const inputId = useId()
  const [term, setTerm] = useState("")

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onOpenChange(false)
    void navigate({
      to: "/",
      search: (prev) => ({ ...prev, q: term.trim() || undefined, page: 1 }),
      hash: "catalogo",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-24 translate-y-0 gap-4 p-6 sm:max-w-lg">
        <DialogTitle className="text-lg">Buscar NFTs</DialogTitle>
        <DialogDescription className="text-sand">Pesquise por nome do NFT ou coleção.</DialogDescription>
        <form role="search" onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Termo de busca
          </label>
          <Input
            id={inputId}
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Ex.: Emerald Ape"
            autoComplete="off"
            className="h-11"
          />
          <Button type="submit" className="h-11" aria-label="Buscar">
            <SearchIcon aria-hidden="true" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
