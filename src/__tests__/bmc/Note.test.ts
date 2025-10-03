import Note from '@/models/Note';
import { describe, expect, it } from 'vitest';

describe('models/Note', () => {
  describe('changeColor', () => {
    it('should add a new unused color', () => {
      expect(Note.changeColor([0], 1, 3)).toEqual([0, 3]);
      expect(Note.changeColor([0, 2], 4, 3)).toEqual([0, 2, 3]);
    });

    it('should shift color when same is added in an empty spot', () => {
      expect(Note.changeColor([0, 1], 2, 0)).toEqual([1, 0]);
      expect(Note.changeColor([0, 1], 3, 0)).toEqual([1, 0]);
    });

    it('should exchange old color with new color on update', () => {
      expect(Note.changeColor([0, 1, 3], 2, 0)).toEqual([3, 1, 0]);
    });

    it('should delete a color if same index same color', () => {
      expect(Note.changeColor([0, 1, 3], 1, 1)).toEqual([0, 3]);
      expect(Note.changeColor([0, 1, 3], 0, 0)).toEqual([1, 3]);
    });
  });
});
