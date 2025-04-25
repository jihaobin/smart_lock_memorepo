import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card group overflow-hidden border border-border/50 bg-gradient-to-br from-card to-background shadow-md hover-lift transition-standard hover:(shadow-xl shadow-primary/5 scale-102) dark:from-card/80 dark:to-background/60">
        <div className="absolute right-0 top-0 h-[100px] w-[100px] translate-x-8 translate-y-[-40px] rounded-full bg-primary/10 opacity-60 blur-xl transition-slow group-hover:(translate-y-[-30px] opacity-80)" />
        <CardHeader>
          <CardDescription className="transition-colors duration-300 group-hover:text-foreground">
            Total Revenue
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums transition-all duration-300 @[250px]/card:text-3xl group-hover:text-primary">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="animate-in fade-in slide-in-from-bottom-1 duration-500"
            >
              <IconTrendingUp className="text-primary animate-pulse-gentle" />
              <span className="ml-1 text-primary">+12.5%</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium transition-colors duration-300 group-hover:text-primary">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card group overflow-hidden border border-border/50 bg-gradient-to-br from-card to-background shadow-md hover-lift transition-standard hover:(shadow-xl shadow-destructive/5 scale-102) dark:from-card/80 dark:to-background/60">
        <div className="absolute right-0 top-0 h-[100px] w-[100px] translate-x-8 translate-y-[-40px] rounded-full bg-destructive/10 opacity-60 blur-xl transition-slow group-hover:(translate-y-[-30px] opacity-80)" />
        <CardHeader>
          <CardDescription className="transition-colors duration-300 group-hover:text-foreground">
            New Customers
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums transition-all duration-300 @[250px]/card:text-3xl group-hover:text-destructive">
            1,234
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="animate-in fade-in slide-in-from-bottom-1 duration-500"
            >
              <IconTrendingDown className="text-destructive animate-pulse-gentle" />
              <span className="ml-1 text-destructive">-20%</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium transition-colors duration-300 group-hover:text-destructive">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card group overflow-hidden border border-border/50 bg-gradient-to-br from-card to-background shadow-md hover-lift transition-standard hover:(shadow-xl shadow-primary/5 scale-102) dark:from-card/80 dark:to-background/60">
        <div className="absolute right-0 top-0 h-[100px] w-[100px] translate-x-8 translate-y-[-40px] rounded-full bg-primary/10 opacity-60 blur-xl transition-slow group-hover:(translate-y-[-30px] opacity-80)" />
        <CardHeader>
          <CardDescription className="transition-colors duration-300 group-hover:text-foreground">
            Active Accounts
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums transition-all duration-300 @[250px]/card:text-3xl group-hover:text-primary">
            45,678
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="animate-in fade-in slide-in-from-bottom-1 duration-500"
            >
              <IconTrendingUp className="text-primary animate-pulse-gentle" />
              <span className="ml-1 text-primary">+12.5%</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium transition-colors duration-300 group-hover:text-primary">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
            Engagement exceed targets
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card group overflow-hidden border border-border/50 bg-gradient-to-br from-card to-background shadow-md hover-lift transition-standard hover:(shadow-xl shadow-primary/5 scale-102) dark:from-card/80 dark:to-background/60">
        <div className="absolute right-0 top-0 h-[100px] w-[100px] translate-x-8 translate-y-[-40px] rounded-full bg-primary/10 opacity-60 blur-xl transition-slow group-hover:(translate-y-[-30px] opacity-80)" />
        <CardHeader>
          <CardDescription className="transition-colors duration-300 group-hover:text-foreground">
            Growth Rate
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums transition-all duration-300 @[250px]/card:text-3xl group-hover:text-primary">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="animate-in fade-in slide-in-from-bottom-1 duration-500"
            >
              <IconTrendingUp className="text-primary animate-pulse-gentle" />
              <span className="ml-1 text-primary">+4.5%</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium transition-colors duration-300 group-hover:text-primary">
            Steady performance increase <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
            Meets growth projections
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
