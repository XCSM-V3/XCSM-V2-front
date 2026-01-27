import type { ButtonHTMLAttributes, DetailedHTMLProps, InputHTMLAttributes, ReactNode } from "react"

export interface ButtonProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
  children?: ReactNode
}

export interface InputProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {}

export interface CardProps {
  className?: string
  children?: ReactNode
}

export interface CardHeaderProps {
  className?: string
  children?: ReactNode
}

export interface CardTitleProps {
  className?: string
  children?: ReactNode
}

export interface CardDescriptionProps {
  className?: string
  children?: ReactNode
}

export interface CardContentProps {
  className?: string
  children?: ReactNode
}

export interface CardFooterProps {
  className?: string
  children?: ReactNode
}
