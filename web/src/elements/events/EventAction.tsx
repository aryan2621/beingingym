import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Event } from '@/model/event';

type EventModalProps = {
    isOpen: boolean;
    onClose: () => void;
    /** Events of the clicked day/week/month; null opens an empty "add" form. */
    events: Event[] | null;
    onSave: (event: Omit<Event, 'id'>, id?: string) => Promise<unknown>;
    onDelete: (id: string) => Promise<unknown>;
};

const toInputValue = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

export function EventModal({ isOpen, onClose, events, onSave, onDelete }: EventModalProps) {
    const [editingId, setEditingId] = useState<string | undefined>();
    const [title, setTitle] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<'save' | string | null>(null);

    const loadForm = (event?: Event) => {
        setEditingId(event?.id);
        setTitle(event?.title ?? '');
        setStart(event ? toInputValue(event.start) : '');
        setEnd(event ? toInputValue(event.end) : '');
        setError(null);
    };

    // Opening on a single event edits it directly; a list or no events starts an empty form.
    useEffect(() => {
        if (isOpen) loadForm(events?.length === 1 ? events[0] : undefined);
    }, [isOpen, events]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (!title.trim() || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            setError('Please fill in a title, start and end.');
            return;
        }
        if (startDate >= endDate) {
            setError('End must be after start.');
            return;
        }
        setBusy('save');
        try {
            await onSave({ title: title.trim(), start: startDate, end: endDate }, editingId);
            onClose();
        } catch {
            setError('Could not save the event. Please try again.');
        } finally {
            setBusy(null);
        }
    };

    const handleDelete = async (id: string) => {
        setBusy(id);
        try {
            await onDelete(id);
            if (editingId === id) loadForm();
            if (!events || events.length <= 1) onClose();
        } catch {
            setError('Could not delete the event. Please try again.');
        } finally {
            setBusy(null);
        }
    };

    const otherEvents = events && events.length > 1 ? events : [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit Event' : 'Add Event'}</DialogTitle>
                    <DialogDescription>{editingId ? 'Update or remove this event.' : 'Create a new event for your calendar.'}</DialogDescription>
                </DialogHeader>

                {otherEvents.length > 0 && (
                    <ul className='space-y-2 max-h-48 overflow-y-auto'>
                        {otherEvents.map((event) => (
                            <li key={event.id} className='flex items-center justify-between gap-2 rounded-md border p-2'>
                                <div className='min-w-0'>
                                    <p className='truncate text-sm font-medium'>{event.title}</p>
                                    <p className='text-xs text-muted-foreground'>
                                        {format(event.start, 'PP p')} – {format(event.end, 'p')}
                                    </p>
                                </div>
                                <div className='flex shrink-0 gap-1'>
                                    <IconButton label='Edit event' variant='ghost' size='sm' onClick={() => loadForm(event)}>
                                        <Pencil className='h-4 w-4' />
                                    </IconButton>
                                    <IconButton
                                        label='Delete event'
                                        variant='ghost'
                                        size='sm'
                                        disabled={busy !== null}
                                        onClick={() => handleDelete(event.id)}
                                    >
                                        {busy === event.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
                                    </IconButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <form onSubmit={handleSubmit}>
                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='title' className='text-right'>
                                Title
                            </Label>
                            <Input id='title' value={title} onChange={(e) => setTitle(e.target.value)} className='col-span-3' />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='start' className='text-right'>
                                Start
                            </Label>
                            <Input id='start' type='datetime-local' value={start} onChange={(e) => setStart(e.target.value)} className='col-span-3' />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='end' className='text-right'>
                                End
                            </Label>
                            <Input id='end' type='datetime-local' value={end} onChange={(e) => setEnd(e.target.value)} className='col-span-3' />
                        </div>
                        {error && <p className='text-sm text-destructive'>{error}</p>}
                    </div>
                    <DialogFooter className='gap-2'>
                        {editingId && (
                            <>
                                <IconButton
                                    label='Delete event'
                                    type='button'
                                    variant='outline'
                                    disabled={busy !== null}
                                    onClick={() => handleDelete(editingId)}
                                >
                                    {busy === editingId ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
                                </IconButton>
                                <IconButton label='New event' type='button' variant='outline' disabled={busy !== null} onClick={() => loadForm()}>
                                    <Plus className='h-4 w-4' />
                                </IconButton>
                            </>
                        )}
                        <Button type='submit' disabled={busy !== null}>
                            {busy === 'save' && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {editingId ? 'Save Changes' : 'Add Event'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
