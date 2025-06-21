import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArvorePage } from './arvore.page';

describe('ArvorePage', () => {
  let component: ArvorePage;
  let fixture: ComponentFixture<ArvorePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ArvorePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
