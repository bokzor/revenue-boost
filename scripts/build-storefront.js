#!/usr/bin/env node

/**
 * Build script for Revenue Boost storefront extension
 * Compiles main bundle + separate popup bundles with Preact
 */

import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, statSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, "..");
const srcDir = join(rootDir, "extensions", "storefront-src");
const extensionDir = join(rootDir, "extensions", "storefront-popup");
const assetsDir = join(extensionDir, "assets");

// Popup bundles to build (matches TemplateType enum)
const popupBundles = [
  "newsletter",           // NEWSLETTER
  "spin-to-win",         // SPIN_TO_WIN
  "flash-sale",          // FLASH_SALE
  "free-shipping",       // FREE_SHIPPING
  "exit-intent",         // EXIT_INTENT
  "cart-abandonment",    // CART_ABANDONMENT
  "product-upsell",      // PRODUCT_UPSELL
  "social-proof",        // SOCIAL_PROOF
  "countdown-timer",     // COUNTDOWN_TIMER
  "scratch-card",        // SCRATCH_CARD
  "announcement",        // ANNOUNCEMENT
];

async function build() {
  try {
    console.log("🔨 Building Revenue Boost Storefront Extension...");
    console.log("📂 Source:", srcDir);
    console.log("📦 Output:", assetsDir);
    console.log("");

    // Plugin to alias React to Preact (for main bundle)
    const aliasPreactPlugin = {
      name: "alias-preact",
      setup(build) {
        build.onResolve({ filter: /^react$/ }, (args) => {
          return build.resolve("preact/compat", {
            kind: args.kind,
            resolveDir: args.resolveDir,
          });
        });
        build.onResolve({ filter: /^react-dom$/ }, (args) => {
          return build.resolve("preact/compat", {
            kind: args.kind,
            resolveDir: args.resolveDir,
          });
        });
      },
    };

    // Plugin to externalize Preact for popup bundles
    // This ensures all bundles use the same Preact instance from window.RevenueBoostPreact
    const externalizePreactPlugin = {
      name: "externalize-preact",
      setup(build) {
        // Externalize react imports to use global Preact
        build.onResolve({ filter: /^react$/ }, () => {
          return { path: "global-preact:react", namespace: "global-preact" };
        });

        build.onResolve({ filter: /^react-dom$/ }, () => {
          return { path: "global-preact:react-dom", namespace: "global-preact" };
        });

        build.onResolve({ filter: /^preact$/ }, () => {
          return { path: "global-preact:preact", namespace: "global-preact" };
        });

        build.onResolve({ filter: /^preact\/hooks$/ }, () => {
          return { path: "global-preact:preact/hooks", namespace: "global-preact" };
        });

        build.onResolve({ filter: /^preact\/compat$/ }, () => {
          return { path: "global-preact:preact/compat", namespace: "global-preact" };
        });

        build.onResolve({ filter: /^preact\/jsx-runtime$/ }, () => {
          return { path: "global-preact:preact/jsx-runtime", namespace: "global-preact" };
        });

        // Provide the global Preact shims
        build.onLoad({ filter: /.*/, namespace: "global-preact" }, (args) => {
          const path = args.path;

          if (path === "global-preact:react" || path === "global-preact:preact/compat") {
            return {
              contents: `
                if (typeof window === "undefined" || !window.RevenueBoostPreact) {
                  throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
                }
                const { h, Component, Fragment, render, createPortal, createContext } = window.RevenueBoostPreact;
                const { useState, useEffect, useCallback, useRef, useMemo, useContext, useDebugValue } = window.RevenueBoostPreact.hooks;
                const createElement = h;
                export {
                  h,
                  createElement,
                  Component,
                  Fragment,
                  render,
                  createPortal,
                  createContext,
                  useState,
                  useEffect,
                  useCallback,
                  useRef,
                  useMemo,
                  useContext,
                  useDebugValue,
                };
                export default {
                  h,
                  createElement,
                  Component,
                  Fragment,
                  render,
                  createPortal,
                  createContext,
                  useState,
                  useEffect,
                  useCallback,
                  useRef,
                  useMemo,
                  useContext,
                  useDebugValue,
                };
              `,
              loader: "js",
            };
          }

          if (path === "global-preact:react-dom") {
            return {
              contents: `
                if (typeof window === "undefined" || !window.RevenueBoostPreact) {
                  throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
                }
                export const render = window.RevenueBoostPreact.render;
                export const createPortal = window.RevenueBoostPreact.createPortal;
                export default { render: window.RevenueBoostPreact.render, createPortal: window.RevenueBoostPreact.createPortal };
              `,
              loader: "js",
            };
          }

          if (path === "global-preact:preact") {
            return {
              contents: `
                if (typeof window === "undefined" || !window.RevenueBoostPreact) {
                  throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
                }
                export const h = window.RevenueBoostPreact.h;
                export const Component = window.RevenueBoostPreact.Component;
                export const Fragment = window.RevenueBoostPreact.Fragment;
                export const render = window.RevenueBoostPreact.render;
                export const options = window.RevenueBoostPreact.options || {};
                export default window.RevenueBoostPreact;
              `,
              loader: "js",
            };
          }

          if (path === "global-preact:preact/hooks") {
            return {
              contents: `
                if (typeof window === "undefined" || !window.RevenueBoostPreact || !window.RevenueBoostPreact.hooks) {
                  throw new Error("RevenueBoostPreact hooks not found. Make sure main bundle is loaded first.");
                }
                export const useState = window.RevenueBoostPreact.hooks.useState;
                export const useEffect = window.RevenueBoostPreact.hooks.useEffect;
                export const useCallback = window.RevenueBoostPreact.hooks.useCallback;
                export const useRef = window.RevenueBoostPreact.hooks.useRef;
                export const useMemo = window.RevenueBoostPreact.hooks.useMemo;
              `,
              loader: "js",
            };
          }

          if (path === "global-preact:preact/jsx-runtime") {
            return {
              contents: `
                if (typeof window === "undefined" || !window.RevenueBoostPreact) {
                  throw new Error("RevenueBoostPreact not found. Make sure main bundle is loaded first.");
                }
                const options = window.RevenueBoostPreact.options || {};
                const h = window.RevenueBoostPreact.h;

                // JSX runtime factory function
                let vnodeId = 0;
                export function jsx(type, props, key, isStaticChildren, __source, __self) {
                  if (!props) props = {};
                  let normalizedProps = props;
                  let ref;

                  if ('ref' in props) {
                    normalizedProps = {};
                    for (let i in props) {
                      if (i === 'ref') ref = props[i];
                      else normalizedProps[i] = props[i];
                    }
                  }

                  const vnode = {
                    type,
                    props: normalizedProps,
                    key: key !== undefined ? key : null,
                    ref: ref !== undefined ? ref : null,
                    __k: null,
                    __: null,
                    __b: 0,
                    __e: null,
                    __c: null,
                    constructor: undefined,
                    __v: --vnodeId,
                    __i: -1,
                    __u: 0,
                    __source,
                    __self
                  };

                  if (typeof type === 'function' && (ref = type.defaultProps)) {
                    for (let i in ref) {
                      if (normalizedProps[i] === undefined) {
                        normalizedProps[i] = ref[i];
                      }
                    }
                  }

                  if (options.vnode) options.vnode(vnode);
                  return vnode;
                }

                export const jsxs = jsx;
                export const jsxDEV = jsx;
                export const createElement = h;
                export const Fragment = window.RevenueBoostPreact.Fragment;
              `,
              loader: "js",
            };
          }

          return null;
        });
      },
    };

    // Common build config
    const commonConfig = {
      bundle: true,
      format: "iife",
      target: "es2020",
      minify: true, // Minification activée pour réduire la taille
      sourcemap: false, // Disable sourcemaps to avoid .map files in Shopify extension assets
      platform: "browser",
      logLevel: "info",
      loader: { ".ts": "ts", ".tsx": "tsx" },
      jsx: "automatic",
      jsxImportSource: "preact",
      plugins: [aliasPreactPlugin],
      define: {
        "process.env.NODE_ENV": '"production"', // Mode production pour optimisations
        global: "window",
      },
      treeShaking: true, // Activer le tree-shaking pour supprimer le code mort
      drop: ['console', 'debugger'], // Supprimer les console.log et debugger en production
    };

    // Build main bundle
    console.log("⚙️  Building main bundle...");
    await esbuild.build({
      ...commonConfig,
      entryPoints: [join(srcDir, "index.ts")],
      outfile: join(assetsDir, "popup-loader.bundle.js"),
      define: {
        ...commonConfig.define,
        __REVENUE_BOOST_DYNAMIC_IMPORT__: "false",
      },
    });

    const mainSize = getFileSize(join(assetsDir, "popup-loader.bundle.js"));
    console.log(`✅ Main bundle: ${mainSize} KB`);
    console.log("");

    // Build popup bundles
    console.log("⚙️  Building popup bundles...");
    const bundleSizes = [];

    for (const bundle of popupBundles) {
      const entryPoint = join(srcDir, "bundles", `${bundle}.ts`);

      if (!existsSync(entryPoint)) {
        console.log(`⚠️  Skipping ${bundle} (entry point not found)`);
        continue;
      }

      // Use externalize plugin for popup bundles to share Preact instance
      await esbuild.build({
        ...commonConfig,
        entryPoints: [entryPoint],
        outfile: join(assetsDir, `${bundle}.bundle.js`),
        plugins: [externalizePreactPlugin], // Use externalize instead of alias
      });

      const size = getFileSize(join(assetsDir, `${bundle}.bundle.js`));
      bundleSizes.push({ name: bundle, size });
      console.log(`  ✅ ${bundle}.bundle.js: ${size} KB`);
    }

    console.log("");
    console.log("✅ Build complete!");
    console.log("");
    console.log("📊 Bundle Summary:");
    console.log(`  Main bundle: ${mainSize} KB`);
    bundleSizes.forEach(({ name, size }) => {
      console.log(`  ${name}: ${size} KB`);
    });

    const totalSize = parseFloat(mainSize) + bundleSizes.reduce((sum, b) => sum + parseFloat(b.size), 0);
    console.log(`  Total (if all loaded): ${totalSize.toFixed(1)} KB`);
    console.log("");
    console.log("ℹ️  Using Preact for 90% smaller bundle size");
    console.log("ℹ️  Popup bundles are loaded on-demand (lazy loading)");
    console.log("");
    console.log("Next steps:");
    console.log("1. Test in development store: shopify app dev");
    console.log("2. Deploy with: shopify app deploy");
  } catch (error) {
    console.error("❌ Build failed:", error);
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
}

function getFileSize(filePath) {
  if (!existsSync(filePath)) return 0;
  const stats = statSync(filePath);
  return (stats.size / 1024).toFixed(1);
}

build();

