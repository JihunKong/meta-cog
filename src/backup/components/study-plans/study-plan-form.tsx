'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const formSchema = z.object({
  subject: z.string().min(1, '과목을 입력해주세요'),
  content: z.string().min(1, '학습 내용을 입력해주세요'),
  target: z.string().min(1, '목표를 입력해주세요'),
  reflection: z.string().optional(),
});

export function StudyPlanForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      content: '',
      target: '',
      reflection: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const response = await fetch('/api/study-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('학습 계획 생성에 실패했습니다');
      }

      toast.success('학습 계획이 생성되었습니다');
      router.push('/study-plans');
      router.refresh();
    } catch (error) {
      toast.error('학습 계획 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>과목</FormLabel>
              <FormControl>
                <Input placeholder="과목을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>학습 내용</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="학습 내용을 입력하세요"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target"
          render={({ field }) => (
            <FormItem>
              <FormLabel>목표</FormLabel>
              <FormControl>
                <Input placeholder="목표를 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reflection"
          render={({ field }) => (
            <FormItem>
              <FormLabel>회고</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="학습 회고를 입력하세요"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? '생성 중...' : '학습 계획 생성'}
        </Button>
      </form>
    </Form>
  );
} 