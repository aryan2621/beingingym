'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Youtube } from 'lucide-react';

import BasicLayout from '@/layout/BasicLayout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import PlayerComponent from '@/elements/PlayerComponent';
import { fetchPlaylist, type PlaylistItem } from '@/service/api';
import { Excercises, Exercise } from '@/utils/enum';
import { cn } from '@/lib/utils';

const PLAYLISTS: Record<Exercise, string> = {
    [Exercise.Cardio]: 'PL7Ax6CP9_hgPM5IQBajGHgd2zLmMPc-GV',
    [Exercise.Legs]: 'PLRCgg2aTq5NUTw6HGN6H5cLapjVU8PCK2',
    [Exercise.Arms]: 'PLRCgg2aTq5NWN3sesjov3AZPptBHsFtvP',
    [Exercise.Back]: 'PLLALQuK1NDrgbrHnrWt_TaQK1sSraAQ1U',
    [Exercise.Chest]: 'PLrzjnSr6-vrLgPRXSgfY8XjlTKN2UppYt',
    [Exercise.Shoulders]: 'PLvD1E8X4SsD-x9_FAQnsU_dScAt0u-7y_',
    [Exercise.Abs]: 'PLvf_LH4Nzg13MLtme6A4pWL8rndhXcYQq',
};

// Not every video has a maxres thumbnail; fall back to the best available size.
const thumbnailUrl = (video: PlaylistItem) => {
    const t = video.snippet.thumbnails;
    return (t.maxres ?? t.standard ?? t.high ?? t.medium ?? t.default)?.url ?? '';
};

const isExercise = (value: string | null): value is Exercise => !!value && (Excercises as string[]).includes(value);

function Tutorials() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const param = searchParams.get('exercise');
    const exercise: Exercise = isExercise(param) ? param : Exercise.Cardio;
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const playerRef = useRef<HTMLDivElement | null>(null);

    const playlistQuery = useQuery({
        queryKey: ['playlist', exercise],
        // Private or deleted videos come back without thumbnails.
        queryFn: async () => ((await fetchPlaylist(PLAYLISTS[exercise])).items ?? []).filter((item) => thumbnailUrl(item)),
        staleTime: 60 * 60 * 1000,
    });
    const videos = playlistQuery.data ?? [];
    const selected = videos.find((v) => v.snippet.resourceId.videoId === selectedId) ?? videos[0];

    useEffect(() => setSelectedId(null), [exercise]);

    const selectExercise = (next: Exercise) => router.replace(`/tutorial?exercise=${next}`, { scroll: false });

    const playVideo = (video: PlaylistItem) => {
        setSelectedId(video.snippet.resourceId.videoId);
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            <PageHeader title='Tutorials' description='Curated workout videos for every muscle group.' icon={Youtube} />

            <div className='mb-8 flex flex-wrap gap-2' role='tablist' aria-label='Muscle group'>
                {Excercises.map((e) => (
                    <Button
                        key={e}
                        role='tab'
                        aria-selected={e === exercise}
                        variant={e === exercise ? 'default' : 'outline'}
                        className='rounded-full'
                        onClick={() => selectExercise(e)}
                    >
                        {e}
                    </Button>
                ))}
            </div>

            {playlistQuery.isLoading ? (
                <div className='flex justify-center py-24'>
                    <Loader2 className='h-6 w-6 animate-spin' aria-label='Loading videos' />
                </div>
            ) : playlistQuery.isError || videos.length === 0 ? (
                <p className='py-24 text-center text-muted-foreground'>
                    {playlistQuery.isError ? 'Could not load videos. Please try again later.' : 'No videos found for this muscle group.'}
                </p>
            ) : (
                <>
                    {selected && (
                        <div ref={playerRef} className='scroll-mt-24 grid gap-6 lg:grid-cols-3'>
                            <div className='lg:col-span-2'>
                                <PlayerComponent
                                    key={selected.snippet.resourceId.videoId}
                                    videoId={selected.snippet.resourceId.videoId}
                                    thumbnailUrl={thumbnailUrl(selected)}
                                />
                            </div>
                            <div>
                                <h2 className='text-xl font-semibold'>{selected.snippet.title}</h2>
                                <p className='mt-2 line-clamp-[10] whitespace-pre-line text-sm text-muted-foreground'>
                                    {selected.snippet.description}
                                </p>
                            </div>
                        </div>
                    )}

                    <h2 className='mb-4 mt-12 text-lg font-semibold'>More {exercise.toLowerCase()} videos</h2>
                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                        {videos.map((video) => {
                            const active = video === selected;
                            return (
                                <button
                                    key={video.id}
                                    type='button'
                                    onClick={() => playVideo(video)}
                                    aria-current={active ? 'true' : undefined}
                                    className={cn(
                                        'group overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                        active && 'border-primary ring-1 ring-primary'
                                    )}
                                >
                                    <div className='relative aspect-video w-full overflow-hidden'>
                                        <Image
                                            src={thumbnailUrl(video)}
                                            alt=''
                                            fill
                                            sizes='(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'
                                            className='object-cover transition-transform duration-300 group-hover:scale-105'
                                        />
                                    </div>
                                    <div className='p-4'>
                                        <h3 className='line-clamp-2 font-semibold'>{video.snippet.title}</h3>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </>
    );
}

export default function TutorialPage() {
    return (
        <BasicLayout>
            {/* useSearchParams needs a Suspense boundary for static rendering. */}
            <Suspense>
                <Tutorials />
            </Suspense>
        </BasicLayout>
    );
}
