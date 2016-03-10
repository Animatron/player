import java.util.*;

public class Clip extends Element {

    public interface Action {
        void run(Element element, double time);
    }

    public static class Timeline {
        private static class ActionTime {
            int timeInTicks;
            Action action;

            public ActionTime(int timeInTicks, Action action) {
                this.timeInTicks = timeInTicks;
                this.action = action;
            }
        }

        private final List<ActionTime> timeActions = new ArrayList<>();

        void add(double time, Action action) {
            timeActions.add(new ActionTime(toTicks(time), action));
            // sort by increasing time
            Collections.sort(timeActions, new Comparator<ActionTime>() {
                @Override
                public int compare(ActionTime o1, ActionTime o2) {
                    return o1.timeInTicks - o2.timeInTicks;
                }
            });
        }

        public void remove(double time, Action action) {
            // tbd
        }

        /**
         * Executes all actions at exactly this time.
         * @param timeInTicks
         */
        void run(Element element, int timeInTicks) {
            for (ActionTime timeAction : timeActions) {
                if (timeAction.timeInTicks==timeInTicks) {
                    timeAction.action.run(element, fromTicks(timeInTicks));
                }
            }
        }

        /**
         * From the given start and delta calculate minimum step which do not go over timeline action.
         */
        int step(int start, int delta) {
            for (ActionTime ta : timeActions) {
                if (ta.timeInTicks > start || ta.timeInTicks == 0 && start == 0) {
                    int step = ta.timeInTicks - start;
                    if (step <= delta) {
                        return step;
                    }
                    return delta;
                }
            }
            return delta;
        }

        public boolean hasTimeActions() {
            return !timeActions.isEmpty();
        }
    }

    public enum State {
        stopped,
        playing
    }

    private Timeline timeline = new Timeline();
    public List<Element> children = new ArrayList<>();

    public int playHeadTicks;   // time in thousands
    public State state = State.playing;

    private boolean hasTimeActionsInHierarchy;

    public Clip(String name) {
        super(name);
    }

    public Clip(String name, TimeBand band) {
        super(name, band);
    }

    public Clip(String name, TimeBand band, EndAction end) {
        super(name, band, end);
    }

    public double playHead() {
        return fromTicks(playHeadTicks);
    }

    public Clip addChild(Element element) {
        element.parent = this;
        children.add(element);

        if (element instanceof Clip) {
            setHasTimeActionsInHierarchy(((Clip)element).hasTimeActionsInHierarchy);
        }

        return this;
    }

    public void removeChild(Element element) {
        children.remove(element);
        element.parent = null;

        updateHasTimeActionsInHierarchy();
    }

    /**
     * Stops this timeline only.
     */
    public void stop() {
        state = State.stopped;
    }

    /**
     * Stops this timeline and all children's timeline
     */
    public void pause() {
        stop();
        for (Element child : children) {
            if (child instanceof Clip) {
                ((Clip)child).pause();
            }
        }
    }

    public void play() {
        state = State.playing;
    }

    public boolean isPlaying() {
        return state == State.playing;
    }

    protected void tickStep(int step, double parentTime) {
        double oldPlayHead = fromTicks(playHeadTicks);

        if (isPlaying()) playHeadTicks += step;

        double playHead = fromTicks(playHeadTicks);

        if (parentTime>=0) runTweens(timeToTweenTime(parentTime));

        for (Element child : children) {
            boolean wasThere = child.isPresentAtTime(oldPlayHead);
            boolean isThere = child.isPresentAtTime(playHead);

            if (wasThere && isThere) {
                child.tickStep(step, playHead);
            } else if (wasThere) {
                // disappeared now, need to play tail
                TimeBand effBand = child.getEffectiveBand();

                child.tickStep(toTicks(effBand.end-oldPlayHead), effBand.end);

            } else if (isThere) {
                // appeared now, need to play head

                TimeBand effBand = child.getEffectiveBand();

                child.tickStep(toTicks(playHead-effBand.start), playHead);
            }
        }

        if (isPlaying()) timeline.run(this, playHeadTicks);
    }

    protected void init() {
        playHeadTicks = 0;
        runTweens(0);
        for (Element child : children) {
            if (child instanceof Clip) {
                TimeBand band = child.getEffectiveBand();
                if (band.start==0) {
                    ((Clip)child).init();
                }
            }
        }
        timeline.run(this, 0);
    }

    public int step(int deltaTicks) {
        if (false && hasTimeActionsInHierarchy) {   // todo: keep it this way until we implement steps
            int step = isPlaying() ? timeline.step(playHeadTicks, deltaTicks) : deltaTicks;

            double oldPlayHead = fromTicks(playHeadTicks);
            double playHead;
            if (isPlaying()) playHead = fromTicks(playHeadTicks + step);
            else playHead = oldPlayHead;

            for (Element child : children) {
                if (!(child instanceof Clip)) continue;

                Clip clip = (Clip) child;

                int newStep;

                TimeBand effBand = child.getEffectiveBand();
                boolean containsOld = effBand.contains(oldPlayHead);
                boolean containsNew = effBand.contains(playHead);

                if (containsOld && containsNew) {
                    // ...[..o....n..]....
                    newStep = clip.step(deltaTicks);
                } else if (containsOld) {
                    // ...[..o...]..n....
                    newStep = clip.step(deltaTicks);
                } else if (containsNew) {
                    // ...o..[...n...]...
                    newStep = clip.step(toTicks(playHead - effBand.start)) + toTicks(effBand.start-oldPlayHead);
                } else {
                    if (oldPlayHead < effBand.start && playHead > effBand.end) {
                        // ...o...[...]...n...
                        newStep = clip.step(deltaTicks);
                    } else {
                        // ...o...n...[...]...
                        // ...[...]...o...n...
                        newStep = step;
                    }
                }

                step = Math.min(step, newStep);
            }
            return step;
        } else {
            return deltaTicks;
        }
    }

    // this is optimization, but important one
    protected boolean hasTimeActions() {
        return timeline.hasTimeActions();
    }

    protected void updateHasTimeActionsInHierarchy() {
        setHasTimeActionsInHierarchy(false);
    }

    protected void setHasTimeActionsInHierarchy(boolean hasActions) {
        hasTimeActionsInHierarchy = hasActions | timeline.hasTimeActions();
        if (parent!=null) parent.setHasTimeActionsInHierarchy(hasTimeActionsInHierarchy);
    }

    public void remove(double time, Action action) {
        timeline.remove(time, action);
        updateHasTimeActionsInHierarchy();
    }

    public void add(double time, Action action) {
        timeline.add(time, action);
        updateHasTimeActionsInHierarchy();
    }

    public Element find(String path) {
        return find(Arrays.asList(path.split("/")));
    }

    protected Element find(List<String> names) {
        for (Element child : children) {
            if (names.get(0).equals(child.name)) {
                if (names.size()==1) return child;

                if (child instanceof Clip) {
                    Element element = ((Clip) child).find(names.subList(1, names.size()));
                    if (element!=null) return element;
                }
            }
        }
        return null;
    }

    public boolean isVisible(Element element) {
        if (element==this) return true;

        for (Element child : children) {
            if (child.isPresentAtTime(playHead())) {
                if (child==element) {
                    return true;
                }

                if (child instanceof Clip) {
                    if (((Clip)child).isVisible(element)) return true;
                }
            }
        }

        return false;
    }

    @Override
    public String toString() {
        return "clip["+name+"]";
    }
}

