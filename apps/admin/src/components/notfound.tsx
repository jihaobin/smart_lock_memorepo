import { Link } from '@tanstack/react-router';
import { Home, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-3xl">
        <Card className="overflow-hidden border-none shadow-xl py-0">
          <div className="grid md:grid-cols-2">
            {/* 视觉部分 */}
            <div className="bg-primary/10 p-6 flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center justify-center animate-pulse opacity-20">
                  <div className="h-40 w-40 rounded-full bg-primary/30"></div>
                </div>
                <span className="relative text-[10rem] font-bold text-primary/80 leading-none">
                  404
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-primary/50">页面未找到</h2>
              <p className="text-primary/50 text-sm max-w-xs ">
                您正在寻找的页面不存在或已被移动。
              </p>
            </div>

            {/* 内容部分 */}
            <div className="p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">迷路了？</h1>
                <p className="text-muted-foreground">
                  别担心，这种情况时有发生。让我们帮您回到正轨。
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <Separator />
                <div className="flex justify-center">
                  <Button asChild className="w-full gap-2">
                    <Link to="/">
                      <Home className="h-4 w-4" />
                      <span>返回首页</span>
                    </Link>
                  </Button>
                </div>
                <Button asChild variant="ghost" className="w-full justify-start gap-2 text-sm">
                  <Link to="..">
                    <ArrowLeft className="h-4 w-4" />
                    <span>返回上一页</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
