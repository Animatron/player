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
                if (ta.timeInTicks >= start) {
                    int step = ta.timeInTicks - start;
                    if (step <= delta) {
                        return step;
                    }
                    return delta;
                }
            }
            return delta;
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
        return this;
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

    /**
     * Regular time advance
     */
    public void tick(double delta) {
        int deltaTicks = toTicks(delta);

        int step;
        do {
            // calculate minimum step to not go over timeline action
            step = step(deltaTicks);

            tickStep(step, -1);
        } while ((deltaTicks -= step) > 0);
    }

    protected void tickStep(int step, double newTime) {
        double oldPlayHead = fromTicks(playHeadTicks);

        if (isPlaying()) playHeadTicks += step;

        double playHead = fromTicks(playHeadTicks);

        runTweens(timeToTweenTime(playHead));

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

    public int step(int deltaTicks) {
        int step = isPlaying()? timeline.step(playHeadTicks, deltaTicks): deltaTicks;
        for (Element child : children) {
            step = Math.min(step, child.step(deltaTicks));
        }
        return step;
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

