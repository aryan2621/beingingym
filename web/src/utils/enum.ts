export enum Exercise {
    Cardio = 'Cardio',
    Legs = 'Legs',
    Arms = 'Arms',
    Back = 'Back',
    Chest = 'Chest',
    Shoulders = 'Shoulders',
    Abs = 'Abs',
}

export enum ExerciseMode {
    Today = 'Today',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
}

export const Excercises = [Exercise.Cardio, Exercise.Legs, Exercise.Arms, Exercise.Back, Exercise.Chest, Exercise.Shoulders, Exercise.Abs];

export const ExerciseModes = [ExerciseMode.Today, ExerciseMode.Weekly, ExerciseMode.Monthly];
export enum Progress {
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
}

export const ProgressModes = [Progress.Daily, Progress.Weekly, Progress.Monthly];
