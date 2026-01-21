'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { createRule } from '@/app/actions/rules'
import { toast } from 'sonner'

const ruleSchema = z.object({
  ruleType: z.enum(['kill_if_cpl_high', 'scale_if_roas_good', 'hold_if_learning']),
  threshold: z.string().transform(Number),
  days: z.string().transform(Number),
  description: z.string().min(5),
})

type RuleInput = z.infer<typeof ruleSchema>

const ruleTemplates = {
  kill_if_cpl_high: {
    label: 'Kill si CPL > X pendant Y jours',
    placeholder: 'Ex: 10 (€)',
  },
  scale_if_roas_good: {
    label: 'Scale si ROAS > X et stable Y jours',
    placeholder: 'Ex: 3 (3x)',
  },
  hold_if_learning: {
    label: 'Hold si < X jours (learning phase)',
    placeholder: 'Ex: 3 (jours)',
  },
}

export function RulesForm() {
  const [loading, setLoading] = useState(false)

  const form = useForm<RuleInput>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      ruleType: 'kill_if_cpl_high',
      threshold: 10,
      days: 3,
      description: '',
    },
  })

  async function onSubmit(data: RuleInput) {
    setLoading(true)
    try {
      await createRule({
        ruleType: data.ruleType,
        threshold: data.threshold,
        days: data.days,
        description: data.description,
      })
      toast.success('Règle créée ✓')
      form.reset()
    } catch (error) {
      toast.error('Erreur: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="ruleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de règle</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ruleTemplates).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="threshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seuil</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={ruleTemplates[form.watch('ruleType')].placeholder}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de jours</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 3" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (humaine)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Kill si CPL > €10 pendant 3j"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Ajouter règle'}
        </Button>
      </form>
    </Form>
  )
}