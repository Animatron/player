import org.junit.Test;
import spec.Point;

import static junit.framework.Assert.assertFalse;
import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.assertEquals;

public class TimelineTests {

    /**
     *  Movie
     *    s1 dur=50
     *       c1   [1................................................40]  (100,100) -> (200,200)
     *         e1    [3..........10]                                      (0,0) -> (10,10)
     */
    @Test
    public void testSimpleTicks() {
        // setup
        Movie m = new Movie();

        Scene s1 = new Scene("s1", 50);
        m.addScene(s1);

        Clip c1 = new Clip("c1", new TimeBand(1, 40));
        c1.addTranslate(new Point(100, 100), new Point(200, 200));
        s1.addChild(c1);

        Element e1 = new Element("e1", new TimeBand(3, 10));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        c1.addChild(e1);

        // test
        m.tick(2);
        assertEquals(2.0, m.playHead());
        assertEquals(1.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
        assertEquals(new Point(102, 102), c1.position);

        m.tick(1);
        assertEquals(3.0, m.playHead());
        assertEquals(2.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
        assertEquals(new Point(105, 105), c1.position);

        m.tick(1);
        assertEquals(3.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(107, 107), c1.position);
        assertEquals(new Point(0, 0), e1.position);

        m.tick(7);
        assertEquals(10.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(125, 125), c1.position);
        assertEquals(new Point(10, 10), e1.position);

        m.tick(1);
        assertEquals(11.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
        assertEquals(new Point(128, 128), c1.position);
    }

    /**
     *  Movie
     *    s1 dur=50
     *       c1   [1...6{....11.....16}] band 1,6, loop(3) (100,100) -> (200,200)
     *         e1  [1........10] (0,0) -> (10,10)
     */
    @Test
    public void testSimpleLoops() {
        // setup
        Movie m = new Movie();

        Scene s1 = new Scene("s1", 50);
        m.addScene(s1);

        Clip c1 = new Clip("c1", new TimeBand(1, 6), new EndAction(EndAction.Type.LOOP, 3));
        c1.addTranslate(new Point(100, 100), new Point(200, 200));
        s1.addChild(c1);

        Element e1 = new Element("e1", new TimeBand(1, 10));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        c1.addChild(e1);

        // test
        m.tick(2);
        assertEquals(2.0, m.playHead());
        assertEquals(1.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(120, 120), c1.position);

        m.tick(4);
        assertEquals(5.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(200, 200), c1.position);
        assertEquals(new Point(4, 4), e1.position);

        m.tick(1);
        assertEquals(6.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(120, 120), c1.position);
        assertEquals(new Point(5, 5), e1.position);

        m.tick(10);
        assertEquals(15.0, c1.playHead());
        assertFalse(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
    }

    /**
     *  Movie
     *    s1 dur=50
     *       c1   [1...6{....11.....16}] band 1,6, bounce(3) (100,100) -> (200,200)
     *         e1  [1........10] (0,0) -> (10,10)
     */
    @Test
    public void testSimpleBounce() {
        // setup
        Movie m = new Movie();

        Scene s1 = new Scene("s1", 50);
        m.addScene(s1);

        Clip c1 = new Clip("c1", new TimeBand(1, 6), new EndAction(EndAction.Type.BOUNCE, 3));
        c1.addTranslate(new Point(100, 100), new Point(200, 200));
        s1.addChild(c1);

        Element e1 = new Element("e1", new TimeBand(1, 10));
        e1.addTranslate(new Point(0, 0), new Point(10, 10));
        c1.addChild(e1);

        // test
        m.tick(2);
        assertEquals(2.0, m.playHead());
        assertEquals(1.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(120, 120), c1.position);

        m.tick(4);
        assertEquals(5.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(200, 200), c1.position);
        assertEquals(new Point(4, 4), e1.position);

        m.tick(1);
        assertEquals(6.0, c1.playHead());
        assertTrue(m.isVisible(c1));
        assertTrue(m.isVisible(e1));
        assertEquals(new Point(180, 180), c1.position);
        assertEquals(new Point(5, 5), e1.position);

        m.tick(10);
        assertEquals(15.0, c1.playHead());
        assertFalse(m.isVisible(c1));
        assertFalse(m.isVisible(e1));
    }

}
